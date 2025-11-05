# Azure DevOps Library Enhancer

Bu extension, Azure DevOps Library/Variable Groups yönetimini geliştirir ve variable group'ları hiyerarşik bir yapıda gösterir.

## Özellikler

- Variable Group isimlerini `-` karakterine göre parse ederek hiyerarşik ağaç yapısı oluşturur
- Collapsible/Expandable grup görünümü
- Yeni sekmede Variable Group detay sayfasını açma özelliği
- Sol tık ile detay sayfasına gitme
- Sağ tık veya Ctrl+Sol tık ile yeni sekmede açma

## Kurulum

1. `npm install` - Bağımlılıkları yükle
2. `npm run build` - Extension'ı derle
3. `npm run package` - .vsix dosyası oluştur
4. Azure DevOps'a yükle

## Geliştirme

```bash
npm run dev
```

## Kullanım

Extension yüklendikten sonra, Pipelines menüsü altında "Enhanced Library" sekmesini göreceksiniz.
