import { ActionIcon, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { NumberType } from '@/db/types';
import { useNumberTypes } from '../hooks';
import { createNumberType, deleteNumberType, updateNumberType } from '../repository';

function TypeRow({ type }: { type: NumberType }) {
  const [name, setName] = useState(type.name);
  const [description, setDescription] = useState(type.description);

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: `「${type.name}」を削除しますか?`,
      children: <Text size="sm">この種類で記録した番号もすべて削除されます。この操作は取り消せません。</Text>,
      labels: { confirm: '削除する', cancel: 'キャンセル' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteNumberType(type.id),
    });

  return (
    <Group gap="xs" align="flex-start" wrap="nowrap">
      <TextInput
        style={{ flex: 1 }}
        aria-label="名前"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onBlur={() => name.trim() && name !== type.name && updateNumberType(type.id, { name: name.trim() })}
      />
      <TextInput
        style={{ flex: 1.4 }}
        aria-label="説明"
        placeholder="説明(任意)"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        onBlur={() => description !== type.description && updateNumberType(type.id, { description })}
      />
      <ActionIcon variant="subtle" color="red" size="lg" aria-label={`${type.name} を削除`} onClick={confirmDelete}>
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  );
}

export function NumberTypeManager({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const isMobile = useMediaQuery('(max-width: 36em)');
  const types = useNumberTypes() ?? [];
  const [newName, setNewName] = useState('');

  const add = async () => {
    if (!newName.trim()) return;
    await createNumberType({ name: newName.trim(), description: '' });
    setNewName('');
  };

  return (
    <Modal opened={opened} onClose={onClose} title="番号の種類" size="lg" fullScreen={isMobile}>
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          伝票番号・請求書番号・問い合わせ番号など、管理したい番号の種類を自由に作れます。
        </Text>
        {types.map((t) => (
          <TypeRow key={t.id} type={t} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <TextInput
              style={{ flex: 1 }}
              placeholder="新しい種類の名前(例: 伝票番号)"
              aria-label="新しい種類の名前"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
            />
            <Button type="submit" leftSection={<IconPlus size={16} />} disabled={!newName.trim()}>
              追加
            </Button>
          </Group>
        </form>
      </Stack>
    </Modal>
  );
}
