package services

import (
	"archive/zip"
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/nongchen1223/tfiction/backend/models"
)

func TestParseEpubNovelExtractsDirectCoverImage(t *testing.T) {
	epubPath := createTestEPUB(t, map[string][]byte{
		"META-INF/container.xml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
		"OEBPS/content.opf": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>测试小说</dc:title>
    <dc:creator>测试作者</dc:creator>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="Images/cover.png" media-type="image/png"/>
    <item id="chapter-1" href="Text/chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter-1"/>
  </spine>
</package>`),
		"OEBPS/Images/cover.png": []byte("png-cover-bytes"),
		"OEBPS/Text/chapter1.xhtml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>第一章</title></head>
  <body><h1>第一章</h1><p>正文内容。</p></body>
</html>`),
	})

	service := NewNovelService(nil)
	novel := &models.Novel{
		FilePath: epubPath,
		Format:   ".epub",
	}

	if err := service.parseEpubNovel(novel); err != nil {
		t.Fatalf("parseEpubNovel returned error: %v", err)
	}

	if !strings.HasPrefix(novel.Cover, "data:image/png;base64,") {
		t.Fatalf("expected png cover data URL, got %q", novel.Cover)
	}
}

func TestParseEpubNovelExtractsGuideCoverPageImage(t *testing.T) {
	epubPath := createTestEPUB(t, map[string][]byte{
		"META-INF/container.xml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
		"OPS/package.opf": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>封面页测试</dc:title>
    <dc:creator>测试作者</dc:creator>
  </metadata>
  <manifest>
    <item id="cover-page" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter-1" href="Text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover-jpg" href="Images/real-cover.jpg" media-type="image/jpeg"/>
  </manifest>
  <spine>
    <itemref idref="cover-page"/>
    <itemref idref="chapter-1"/>
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="Text/cover.xhtml"/>
  </guide>
</package>`),
		"OPS/Text/cover.xhtml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Cover</title></head>
  <body>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180">
      <image href="../Images/real-cover.jpg" width="120" height="180" />
    </svg>
  </body>
</html>`),
		"OPS/Text/chapter1.xhtml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>第一章</title></head>
  <body><h1>第一章</h1><p>正文内容。</p></body>
</html>`),
		"OPS/Images/real-cover.jpg": []byte("jpeg-cover-bytes"),
	})

	service := NewNovelService(nil)
	novel := &models.Novel{
		FilePath: epubPath,
		Format:   ".epub",
	}

	if err := service.parseEpubNovel(novel); err != nil {
		t.Fatalf("parseEpubNovel returned error: %v", err)
	}

	if !strings.HasPrefix(novel.Cover, "data:image/jpeg;base64,") {
		t.Fatalf("expected jpeg cover data URL, got %q", novel.Cover)
	}
}

func TestParseEpubNovelExtractsFrontMatterBackgroundCover(t *testing.T) {
	epubPath := createTestEPUB(t, map[string][]byte{
		"META-INF/container.xml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="Book/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
		"Book/content.opf": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>前置页封面测试</dc:title>
    <dc:creator>测试作者</dc:creator>
  </metadata>
  <manifest>
    <item id="page-1" href="Text/page-1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter-1" href="Text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="page-image" href="/Images/front-cover.webp" media-type="image/webp"/>
  </manifest>
  <spine>
    <itemref idref="page-1"/>
    <itemref idref="chapter-1"/>
  </spine>
</package>`),
		"Book/Text/page-1.xhtml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>扉页</title></head>
  <body style="background-image: url('/Images/front-cover.webp'); background-size: cover;">
    <div></div>
  </body>
</html>`),
		"Book/Text/chapter1.xhtml": []byte(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>第一章</title></head>
  <body><h1>第一章</h1><p>正文内容。</p></body>
</html>`),
		"Book/Images/front-cover.webp": []byte("webp-cover-bytes"),
	})

	service := NewNovelService(nil)
	novel := &models.Novel{
		FilePath: epubPath,
		Format:   ".epub",
	}

	if err := service.parseEpubNovel(novel); err != nil {
		t.Fatalf("parseEpubNovel returned error: %v", err)
	}

	if !strings.HasPrefix(novel.Cover, "data:image/webp;base64,") {
		t.Fatalf("expected webp cover data URL, got %q", novel.Cover)
	}
}

func TestParsePdfNovelExtractsMetadataTextAndChapters(t *testing.T) {
	pdfPath := createTestPDF(t, "PDF Sample", "PDF Author", []string{
		"Chapter 1\nFirst page content.",
		"Chapter 2\nSecond page content.",
	})

	service := NewNovelService(nil)
	novel := &models.Novel{
		FilePath: pdfPath,
		Format:   ".pdf",
		Title:    "fallback-title",
		Author:   "fallback-author",
	}

	if err := service.parsePdfNovel(novel); err != nil {
		t.Fatalf("parsePdfNovel returned error: %v", err)
	}

	if novel.Title != "PDF Sample" {
		t.Fatalf("expected PDF metadata title, got %q", novel.Title)
	}

	if novel.Author != "PDF Author" {
		t.Fatalf("expected PDF metadata author, got %q", novel.Author)
	}

	if !strings.Contains(novel.Content, "First page content.") {
		t.Fatalf("expected extracted text from first page, got %q", novel.Content)
	}

	if !strings.Contains(novel.Content, "Second page content.") {
		t.Fatalf("expected extracted text from second page, got %q", novel.Content)
	}

	if len(novel.Chapters) != 2 {
		t.Fatalf("expected 2 chapters, got %d", len(novel.Chapters))
	}

	if novel.Chapters[0].Title != "Chapter 1" {
		t.Fatalf("expected first chapter title to be parsed, got %q", novel.Chapters[0].Title)
	}
}

func TestParsePdfNovelFallsBackToRenderedPagesWhenNoReadableText(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("image-based PDF fallback currently relies on macOS PDF rendering")
	}

	pdfPath := createTestPDF(t, "Empty PDF", "PDF Author", []string{""})

	service := NewNovelService(nil)
	novel := &models.Novel{
		FilePath: pdfPath,
		Format:   ".pdf",
	}

	if err := service.parsePdfNovel(novel); err != nil {
		t.Fatalf("expected image-based PDF fallback to succeed, got %v", err)
	}

	if len(novel.Chapters) != 1 {
		t.Fatalf("expected 1 page chapter, got %d", len(novel.Chapters))
	}

	if novel.Chapters[0].Title != "第1页" {
		t.Fatalf("expected first page title, got %q", novel.Chapters[0].Title)
	}

	html, err := service.getPDFChapterHTML(pdfPath, 0)
	if err != nil {
		t.Fatalf("expected rendered page HTML, got %v", err)
	}

	if !strings.Contains(html, `data-chapter-rich="true"`) {
		t.Fatalf("expected rich page html marker, got %q", html)
	}

	if !strings.Contains(html, "data:image/png;base64,") {
		t.Fatalf("expected rendered png data url, got %q", html)
	}
}

func createTestEPUB(t *testing.T, files map[string][]byte) string {
	t.Helper()

	tempDir := t.TempDir()
	epubPath := filepath.Join(tempDir, "sample.epub")
	outputFile, err := os.Create(epubPath)
	if err != nil {
		t.Fatalf("create epub file: %v", err)
	}
	defer outputFile.Close()

	writer := zip.NewWriter(outputFile)
	for name, content := range files {
		entryWriter, err := writer.Create(name)
		if err != nil {
			t.Fatalf("create zip entry %s: %v", name, err)
		}

		if _, err := entryWriter.Write(content); err != nil {
			t.Fatalf("write zip entry %s: %v", name, err)
		}
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("close zip writer: %v", err)
	}

	return epubPath
}

func createTestPDF(t *testing.T, title, author string, pageTexts []string) string {
	t.Helper()

	if len(pageTexts) == 0 {
		pageTexts = []string{""}
	}

	tempDir := t.TempDir()
	pdfPath := filepath.Join(tempDir, "sample.pdf")

	pageObjectStart := 3
	contentObjectStart := pageObjectStart + len(pageTexts)
	fontObjectNumber := contentObjectStart + len(pageTexts)
	infoObjectNumber := fontObjectNumber + 1
	objectCount := infoObjectNumber

	objects := make([]string, objectCount+1)
	pageRefs := make([]string, 0, len(pageTexts))

	for index, pageText := range pageTexts {
		pageObjectNumber := pageObjectStart + index
		contentObjectNumber := contentObjectStart + index
		pageRefs = append(pageRefs, fmt.Sprintf("%d 0 R", pageObjectNumber))

		objects[pageObjectNumber] = fmt.Sprintf(
			"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents %d 0 R /Resources << /Font << /F1 %d 0 R >> >> >>",
			contentObjectNumber,
			fontObjectNumber,
		)

		stream := buildTestPDFContentStream(pageText)
		objects[contentObjectNumber] = fmt.Sprintf(
			"<< /Length %d >>\nstream\n%s\nendstream",
			len(stream),
			stream,
		)
	}

	objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"
	objects[2] = fmt.Sprintf(
		"<< /Type /Pages /Kids [%s] /Count %d >>",
		strings.Join(pageRefs, " "),
		len(pageTexts),
	)
	objects[fontObjectNumber] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
	objects[infoObjectNumber] = fmt.Sprintf(
		"<< /Title (%s) /Author (%s) >>",
		escapeTestPDFString(title),
		escapeTestPDFString(author),
	)

	var buffer bytes.Buffer
	buffer.WriteString("%PDF-1.4\n")

	offsets := make([]int, objectCount+1)
	for objectNumber := 1; objectNumber <= objectCount; objectNumber++ {
		offsets[objectNumber] = buffer.Len()
		fmt.Fprintf(&buffer, "%d 0 obj\n%s\nendobj\n", objectNumber, objects[objectNumber])
	}

	xrefOffset := buffer.Len()
	fmt.Fprintf(&buffer, "xref\n0 %d\n", objectCount+1)
	buffer.WriteString("0000000000 65535 f \n")
	for objectNumber := 1; objectNumber <= objectCount; objectNumber++ {
		fmt.Fprintf(&buffer, "%010d 00000 n \n", offsets[objectNumber])
	}

	fmt.Fprintf(
		&buffer,
		"trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n",
		objectCount+1,
		infoObjectNumber,
		xrefOffset,
	)

	if err := os.WriteFile(pdfPath, buffer.Bytes(), 0644); err != nil {
		t.Fatalf("write pdf file: %v", err)
	}

	return pdfPath
}

func buildTestPDFContentStream(pageText string) string {
	lines := strings.Split(pageText, "\n")
	var builder strings.Builder
	for index, line := range lines {
		y := 720 - index*24
		builder.WriteString("BT\n/F1 18 Tf\n")
		builder.WriteString(fmt.Sprintf("72 %d Td\n", y))
		builder.WriteString(fmt.Sprintf("(%s) Tj\n", escapeTestPDFString(line)))
		builder.WriteString("ET\n")
	}
	return strings.TrimSpace(builder.String())
}

func escapeTestPDFString(value string) string {
	replacer := strings.NewReplacer(
		"\\", "\\\\",
		"(", "\\(",
		")", "\\)",
	)
	return replacer.Replace(value)
}
