import { Typography } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** タスクの中身などユーザーが書いた Markdown を表示する(生 HTML は描画しない) */
export function Markdown({ children }: { children: string }) {
  return (
    <Typography fz="sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </Typography>
  );
}
