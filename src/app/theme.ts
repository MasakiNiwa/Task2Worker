import { createTheme, type MantineColorsTuple } from '@mantine/core';

// ダークモードは彩度を落とした墨色系。真っ黒・高コントラストを避け、長時間見ても疲れない配色にする。
const dark: MantineColorsTuple = [
  '#c9ccd1', // 0: 本文テキスト
  '#a9adb4',
  '#8a8f97', // 2: 補足テキスト
  '#5f646c',
  '#3a3e45', // 4: 枠線
  '#2c2f35', // 5: ホバー
  '#24272c', // 6: カード
  '#1e2025', // 7: 背景
  '#191b1f',
  '#141519',
];

// アクセント色: くすんだ青緑(sage-teal)
const sage: MantineColorsTuple = [
  '#eef4f3',
  '#dbe6e4',
  '#b5cdc9',
  '#8db3ad',
  '#6c9d96',
  '#578f87',
  '#4b8780',
  '#3b756e',
  '#306862',
  '#205a54',
];

export const theme = createTheme({
  primaryColor: 'sage',
  primaryShade: { light: 7, dark: 8 },
  colors: { dark, sage },
  fontFamily:
    '"Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, system-ui, sans-serif',
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Card: { defaultProps: { withBorder: true, radius: 'md', padding: 'md' } },
    Paper: { defaultProps: { radius: 'md' } },
  },
});
