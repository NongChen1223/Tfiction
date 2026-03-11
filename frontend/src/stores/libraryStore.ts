import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Book } from '@/types'

interface LibraryState {
  books: Book[]
  upsertBook: (book: Book) => void
  createDirectory: (name: string) => void
  renameBook: (bookId: string, title: string) => void
  removeBook: (bookId: string) => void
  moveBooksToDirectory: (directoryId: string, fileIds: string[]) => void
  addImportedFileToDirectory: (directoryId: string, book: Book) => void
  updateProgressByFilePath: (
    filePath: string,
    payload: { progress: number; lastReadTime: number }
  ) => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      books: [],

      upsertBook: (book) =>
        set((state) => {
          const existing = state.books.find((item) => item.id === book.id)
          if (!existing) {
            return { books: [book, ...state.books] }
          }

          return {
            books: state.books.map((item) =>
              item.id === book.id ? { ...existing, ...book } : item
            ),
          }
        }),

      createDirectory: (name) =>
        set((state) => ({
          books: [
            {
              id: `directory:${crypto.randomUUID()}`,
              title: name,
              author: '自定义目录',
              type: 'novel',
              category: '目录',
              isDirectory: true,
              totalFiles: 0,
              files: [],
              createdAt: Date.now(),
            },
            ...state.books,
          ],
        })),

      renameBook: (bookId, title) =>
        set((state) => ({
          books: state.books.map((book) =>
            book.id === bookId ? { ...book, title: title.trim() || book.title } : book
          ),
        })),

      removeBook: (bookId) =>
        set((state) => ({
          books: state.books.filter((book) => book.id !== bookId),
        })),

      moveBooksToDirectory: (directoryId, fileIds) =>
        set((state) => {
          const filesToMove = state.books.filter(
            (book) => fileIds.includes(book.id) && !book.isDirectory
          )
          if (filesToMove.length === 0) {
            return state
          }

          return {
            books: state.books
              .map((book) => {
                if (book.id !== directoryId || !book.isDirectory) {
                  return book
                }

                const existingFiles = book.files || []
                const newFiles = filesToMove.map((file, index) => ({
                  id: file.id,
                  title: file.title,
                  filePath: file.filePath || '',
                  format: file.format || '',
                  fileSize: file.fileSize || 0,
                  progress: file.progress || 0,
                  lastReadTime: file.lastReadTime,
                  order: existingFiles.length + index + 1,
                }))

                return {
                  ...book,
                  files: [...existingFiles, ...newFiles],
                  totalFiles: existingFiles.length + newFiles.length,
                }
              })
              .filter((book) => !fileIds.includes(book.id)),
          }
        }),

      addImportedFileToDirectory: (directoryId, importedBook) =>
        set((state) => ({
          books: state.books.map((book) => {
            if (book.id !== directoryId || !book.isDirectory) {
              return book
            }

            const existingFiles = book.files || []
            return {
              ...book,
              files: [
                ...existingFiles,
                {
                  id: importedBook.id,
                  title: importedBook.title,
                  filePath: importedBook.filePath || '',
                  format: importedBook.format || '',
                  fileSize: importedBook.fileSize || 0,
                  progress: importedBook.progress || 0,
                  lastReadTime: importedBook.lastReadTime,
                  order: existingFiles.length + 1,
                },
              ],
              totalFiles: existingFiles.length + 1,
            }
          }),
        })),

      updateProgressByFilePath: (filePath, payload) =>
        set((state) => ({
          books: state.books.map((book) => {
            if (book.isDirectory) {
              const updatedFiles =
                book.files?.map((file) =>
                  file.filePath === filePath
                    ? {
                        ...file,
                        progress: payload.progress,
                        lastReadTime: payload.lastReadTime,
                      }
                    : file
                ) || []

              const lastReadFile = updatedFiles.find((file) => file.filePath === filePath)
              if (!lastReadFile) {
                return book
              }

              return {
                ...book,
                files: updatedFiles,
                lastReadTime: payload.lastReadTime,
                lastReadFileId: lastReadFile.id,
              }
            }

            if (book.filePath !== filePath) {
              return book
            }

            return {
              ...book,
              progress: payload.progress,
              lastReadTime: payload.lastReadTime,
            }
          }),
        })),
    }),
    {
      name: 'tfiction-library',
    }
  )
)
