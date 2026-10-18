import { useState } from 'react';
import type { NumberRecord } from '@/db/types';
import type { NumberRecordInput } from '../repository';
import { NumberRecordModal } from './NumberRecordModal';

type EditorState = { opened: false } | { opened: true; record?: NumberRecord; defaults?: Partial<NumberRecordInput> };

/** 番号の記録/編集モーダルを開くためのフック */
export function useNumberRecordEditor() {
  const [state, setState] = useState<EditorState>({ opened: false });
  const close = () => setState({ opened: false });

  return {
    openNew: (defaults?: Partial<NumberRecordInput>) => setState({ opened: true, defaults }),
    openEdit: (record: NumberRecord) => setState({ opened: true, record }),
    /** 過去の番号を引き継いで、今日の日付で新しく記録する */
    openReuse: (r: NumberRecord) =>
      setState({ opened: true, defaults: { typeId: r.typeId, value: r.value, taskId: r.taskId, memo: r.memo } }),
    modal: (
      <NumberRecordModal
        opened={state.opened}
        onClose={close}
        record={state.opened ? state.record : undefined}
        defaults={state.opened ? state.defaults : undefined}
      />
    ),
  };
}
