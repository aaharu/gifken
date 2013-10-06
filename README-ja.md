gifken
======

JavaScriptでGIF画像の解析、及び作成をすることができます。  
現在アルファ版です。

あとでまとめます。

使い方
------

### ブラウザ

1. gifkenのロード  
```
<script src="javascripts/gifken.min.js"></script>
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
│   └── chromeextension
└── src                       ソース
```

ビルド方法
------

以下のものが必要です。
* Node.js ~0.8
* npm

```
git clone *thisrepo*
cd gifken
npm install

```

License
------

see https://github.com/aaharu/gifken/blob/master/LICENSE
