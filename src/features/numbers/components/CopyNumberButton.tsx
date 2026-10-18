import { ActionIcon, CopyButton, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

export function CopyNumberButton({ value }: { value: string }) {
  return (
    <CopyButton value={value} timeout={1500}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'コピーしました' : 'コピー'} withArrow>
          <ActionIcon
            variant="subtle"
            color={copied ? 'sage' : 'gray'}
            aria-label={`${value} をコピー`}
            onClick={(e) => {
              e.stopPropagation();
              copy();
            }}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
