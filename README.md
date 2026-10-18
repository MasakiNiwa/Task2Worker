# Task2Worker

生き抜くためのタスク管理ダッシュボード

公開ページ: https://masakiniwa.github.io/Task2Worker/

## 特長

- 年次・四半期・月次・週次・日次・1日複数回の繰り返しタスク
- 実施してもリストから消えない(実施記録として残り、次の期間で再び未実施に戻る)
- 前回やり残したタスク・番号の記録漏れを表示
- 伝票番号などユーザー定義の番号をタスクと紐付けて管理・再利用
- 分析(年度→四半期→月→日のドリルダウン、達成率、曜日×時間帯ヒートマップ)
  - 集計は Web Worker、ヒートマップは WebGPU(非対応環境は CPU)で計算
  - 分析ツールは `src/features/analytics/tools/index.ts` に登録して追加できる
- スマホ / PC 両対応、落ち着いたダークモード、PWA(ホーム画面に追加・オフライン動作)
- データはブラウザ内(IndexedDB)に保存。JSON でバックアップ/復元、CSV 書き出し

## 開発

```bash
npm ci
npm run dev        # 開発サーバー
npm test           # テスト
npm run lint       # Lint
npm run build      # 本番ビルド (dist/)
```

`main` にマージすると GitHub Actions でビルドされ GitHub Pages に公開されます。

### ディレクトリ構成

```
src/
  app/          テーマ・ルート定義(画面はここに登録するとナビにも反映)
  components/   共通 UI・レイアウト
  db/           IndexedDB スキーマ (Dexie)。変更時は version を上げて移行処理を書く
  features/     機能ごとのロジック
  pages/        画面
scripts/        ビルド補助スクリプト
```

## ライセンス

[MIT License](./LICENSE)

利用しているサードパーティ製ライブラリは [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) を参照してください(`npm run licenses` で自動生成)。
