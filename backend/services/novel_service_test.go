package services

import (
	"archive/zip"
	"os"
	"path/filepath"
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
