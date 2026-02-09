import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
  Collapse,
  AutoComplete,
  Tooltip,
  Typography
} from 'antd';
import { ATTRIBUTE_INPUT_TYPES } from '@shared';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAttributes, useAllAttributeValues } from '../../services/queries';
import {
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
} from '../../services/mutations';
import type { Attribute, AttributeValue, AttributeValueWithAttribute } from '../../services/queries';
import { PageHeader } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';
import { cardStyle, contentContainerStyle } from '@/ui/styles';

const { Text } = Typography;

type AttributeFormValues = {
  code: string;
  name: string;
  filterType?: string;
  values?: {
    id?: string;
    value: string;
    metaValue?: string;
    order?: number;
  }[];
};

type AttributeUpsertPayload = {
  code: string;
  name: Record<string, string>;
  filterType?: string;
  values?: {
    id?: string;
    value: Record<string, string>;
    metaValue?: string;
    order?: number;
  }[];
};

type ValueFormValues = {
  value: string;
  metaValue?: string;
  order?: number;
};

function stringifyName(name?: Record<string, string>) {
  if (!name) return '';
  return name.en || name.vi || Object.values(name)[0] || '';
}

export function AttributePageView() {
  const { data, isLoading, refetch } = useAttributes();
  const createAttr = useCreateAttribute();
  const updateAttr = useUpdateAttribute();
  const deleteAttr = useDeleteAttribute();
  const createValue = useCreateAttributeValue();
  const updateValue = useUpdateAttributeValue();
  const deleteValue = useDeleteAttributeValue();

  const [attrForm] = Form.useForm<AttributeFormValues>();
  const [valueForm] = Form.useForm<ValueFormValues>();
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [editingValue, setEditingValue] = useState<{
    attributeId: string;
    value: AttributeValue | null;
  } | null>(null);
  const [valueSearch, setValueSearch] = useState('');
  const { data: allValues = [] } = useAllAttributeValues(valueSearch || undefined);

  const attributes = data || [];

  const attrColumns: ColumnsType<Attribute> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        render: (code: string) => (
          <span style={{ fontFamily: tokens.typography.fontFamily.mono, color: tokens.neutral.textPrimary }}>
            {code}
          </span>
        ),
      },
      {
        title: 'Attribute Name',
        dataIndex: 'name',
        key: 'name',
        render: (name: Record<string, string>) => (
          <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>
            {stringifyName(name)}
          </span>
        ),
      },
      {
        title: 'Filter Type',
        dataIndex: 'filterType',
        key: 'filterType',
        render: (ft?: string) => ft ? <Tag>{ft}</Tag> : <span style={{ color: tokens.neutral.textTertiary }}>-</span>,
      },
      {
        title: 'Values Count',
        key: 'values',
        render: (_, record) => (
          <span style={{ color: tokens.neutral.textSecondary }}>
            {record.values?.length ?? 0}
          </span>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space size={8}>
            <Tooltip title="Edit Attribute">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingAttr(record);
                  attrForm.setFieldsValue({
                    code: record.code,
                    name: stringifyName(record.name),
                    filterType: record.filterType ?? undefined,
                    values: (record.values || []).map((v) => ({
                      id: v.id,
                      value: stringifyName(v.value),
                      metaValue: v.metaValue ?? undefined,
                      order: v.order ?? undefined,
                    })),
                  });
                  setAttrModalOpen(true);
                }}
                style={{ color: tokens.action.secondary }}
              />
            </Tooltip>
            <Tooltip title="Delete Attribute">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={async () => {
                  Modal.confirm({
                    title: `Delete attribute ${record.code}?`,
                    content: 'This will also delete all associated values.',
                    okText: 'Delete',
                    cancelText: 'Cancel',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      try {
                        await deleteAttr.mutateAsync(record.id);
                        message.success('Attribute deleted');
                      } catch (err) {
                        message.error(err instanceof Error ? err.message : 'Delete failed');
                      }
                    },
                  });
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [attrForm, deleteAttr],
  );

  const handleSubmitAttribute = async () => {
    try {
      const formValues = await attrForm.validateFields();

      const basePayload: AttributeUpsertPayload = {
        code: formValues.code,
        name: { vi: formValues.name, en: formValues.name }, // Using same name for simplicity, ideal: separate fields
        filterType: formValues.filterType || undefined,
      };

      const formValueList =
        (formValues.values as { id?: string; value: string; metaValue?: string; order?: number }[]) ||
        [];

      const cleanedValues = formValueList.filter((v) => v && v.value);
      if (cleanedValues.length) {
        basePayload.values = cleanedValues.map((v) => ({
          id: v.id,
          value: { vi: v.value, en: v.value },
          metaValue: v.metaValue,
          order: v.order,
        }));
      }

      if (editingAttr) {
        await updateAttr.mutateAsync({
          id: editingAttr.id,
          data: basePayload as unknown as Partial<Attribute>,
        });
        message.success('Attribute updated');
      } else {
        await createAttr.mutateAsync(basePayload as unknown as Partial<Attribute>);
        message.success('Attribute created');
      }

      setAttrModalOpen(false);
      setEditingAttr(null);
      attrForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error saving attribute');
    }
  };

  const handleSubmitValue = async () => {
    if (!editingValue) return;
    const { attributeId, value } = editingValue;
    try {
      const values = await valueForm.validateFields();
      const payload = {
        value: { vi: values.value, en: values.value },
        metaValue: values.metaValue,
        order: values.order,
      };
      if (value) {
        await updateValue.mutateAsync({
          attributeId,
          valueId: value.id,
          data: payload,
        });
        message.success('Value updated');
      } else {
        await createValue.mutateAsync({ attributeId, data: payload });
        message.success('Value added');
      }
      setValueModalOpen(false);
      setEditingValue(null);
      valueForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error saving value');
    }
  };

  return (
    <div>
      <PageHeader
        title="Product Attributes"
        subtitle="Manage product attributes and their values"
        actions={
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingAttr(null);
                attrForm.resetFields();
                setAttrModalOpen(true);
              }}
            >
              Add Attribute
            </Button>
          </div>
        }
      />

      <div style={contentContainerStyle}>
        <div style={cardStyle}>
          <Table<Attribute>
            rowKey="id"
            loading={isLoading}
            columns={attrColumns.map(col => ({
              ...col,
              title: <span style={{ fontSize: 13, fontWeight: 500, color: tokens.neutral.textSecondary }}>{col.title}</span>
            }))}
            dataSource={attributes}
            size="middle"
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: tokens.spacing.md, backgroundColor: tokens.neutral.background }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: tokens.spacing.sm
                  }}>
                    <Text strong style={{ fontSize: tokens.typography.fontSize.sm }}>Attribute Values: {stringifyName(record.name)}</Text>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingValue({ attributeId: record.id, value: null });
                        valueForm.resetFields();
                        setValueModalOpen(true);
                      }}
                    >
                      Add Value
                    </Button>
                  </div>
                  <Table<AttributeValue>
                    size="small"
                    rowKey="id"
                    dataSource={record.values || []}
                    pagination={false}
                    bordered
                    columns={[
                      {
                        title: 'Value',
                        dataIndex: 'value',
                        render: (v: Record<string, string>) => (
                          <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>{stringifyName(v)}</span>
                        ),
                      },
                      { title: 'Meta', dataIndex: 'metaValue', render: (v?: string) => v || <span style={{ color: tokens.neutral.textTertiary }}>-</span> },
                      { title: 'Order', dataIndex: 'order', render: (v?: number | null) => v ?? <span style={{ color: tokens.neutral.textTertiary }}>-</span> },
                      {
                        title: 'Actions',
                        width: 100,
                        render: (_, v) => (
                          <Space size={4}>
                            <Tooltip title="Edit Value">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingValue({ attributeId: record.id, value: v });
                                  valueForm.setFieldsValue({
                                    value: stringifyName(v.value),
                                    metaValue: v.metaValue ?? undefined,
                                    order: v.order ?? undefined,
                                  });
                                  setValueModalOpen(true);
                                }}
                                style={{ color: tokens.action.secondary }}
                              />
                            </Tooltip>
                            <Tooltip title="Delete Value">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() =>
                                  Modal.confirm({
                                    title: 'Delete value?',
                                    okText: 'Delete',
                                    cancelText: 'Cancel',
                                    okButtonProps: { danger: true },
                                    onOk: async () => {
                                      try {
                                        await deleteValue.mutateAsync({
                                          attributeId: record.id,
                                          valueId: v.id,
                                        });
                                        message.success('Value deleted');
                                      } catch (err) {
                                        message.error(err instanceof Error ? err.message : 'Delete failed');
                                      }
                                    },
                                  })
                                }
                              />
                            </Tooltip>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Modal
        title={editingAttr ? 'Edit Attribute' : 'Create Attribute'}
        open={attrModalOpen}
        centered
        onCancel={() => {
          setAttrModalOpen(false);
          setEditingAttr(null);
          attrForm.resetFields();
        }}
        onOk={handleSubmitAttribute}
        confirmLoading={createAttr.isPending || updateAttr.isPending}
        destroyOnClose
        width={600}
      >
        <Form form={attrForm} layout="vertical" requiredMark="optional">
          <Form.Item
            name="code"
            label="Attribute Code"
            rules={[{ required: true, message: 'Please enter code' }]}
            extra="Unique identifier, e.g. color, size"
          >
            <Input placeholder="e.g. material" disabled={!!editingAttr} style={{ fontFamily: tokens.typography.fontFamily.mono }} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Attribute Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Displayed Name" />
          </Form.Item>
          <Form.Item name="filterType" label="Filter Type">
            <Select
              allowClear
              placeholder="Select filter type (optional)"
              options={ATTRIBUTE_INPUT_TYPES.map((t: string) => ({
                label: t,
                value: t,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingValue?.value ? 'Edit Value' : 'Add Value'}
        open={valueModalOpen}
        centered
        onCancel={() => {
          setValueModalOpen(false);
          setEditingValue(null);
          valueForm.resetFields();
        }}
        onOk={handleSubmitValue}
        confirmLoading={createValue.isPending || updateValue.isPending}
        destroyOnClose
      >
        <Form form={valueForm} layout="vertical" requiredMark="optional">
          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please enter value' }]}
          >
            <Input placeholder="e.g. Gold, Silver" />
          </Form.Item>
          <Form.Item name="metaValue" label="Meta Value" extra="Optional metadata (e.g. hex color code)">
            <Input placeholder="e.g. #FFD700" style={{ fontFamily: tokens.typography.fontFamily.mono }} />
          </Form.Item>
          <Form.Item name="order" label="Sort Order">
            <Input type="number" placeholder="Optional" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
