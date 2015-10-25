gifken
======

JavaScriptでGIF画像の解析、及び作成をすることができます。  
現在アルファ版です。

あとでまとめます。

- http://aaharu.github.io/gifken/
- [API Docs][http://aaharu.github.io/gifken/docs/]

使い方
------

### ブラウザ

1. gifkenのロード  
```html
<script src="javascripts/gifken-client.min.js"></script>
```
2. hoge

機能
------

GIF画像のロード
```javascript
gifken.Gif.parse(arraybuffer);
```

ディレクトリ構成
------

```
gifken
├── build                     ビルド結果
├── node_modules
├── sample                    サンプル
│   ├── chromeextension
│   └── node
├── src                       ソース
└── test
```

ビルド方法
------

以下のものが必要です。
* Node.js ~0.10
* npm
* grunt

```
git clone *thisrepo*
cd gifken
npm install
grunt
```

ライセンス
------

see https://github.com/aaharu/gifken/blob/master/LICENSE
