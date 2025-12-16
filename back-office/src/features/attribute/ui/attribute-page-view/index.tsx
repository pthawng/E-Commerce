import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
  Collapse,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { useAttributes } from '../../api/queries';
import {
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
} from '../../api/mutations';
import type { Attribute, AttributeValue } from '../../api/queries';

type AttributeFormValues = {
  code: string;
  name: string;
  filterType?: string;
};

type ValueFormValues = {
  value: string;
  metaValue?: string;
  order?: number;
};

function stringifyName(name?: Record<string, string>) {
  if (!name) return '';
  return name.vi || name.en || Object.values(name)[0] || '';
}

export function AttributePageView() {
  const { data, isLoading } = useAttributes();
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

  const attributes = data || [];

  const attrColumns: ColumnsType<Attribute> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
      },
      {
        title: 'Tên',
        dataIndex: 'name',
        render: (name: Record<string, string>) => stringifyName(name),
      },
      {
        title: 'Filter Type',
        dataIndex: 'filterType',
        render: (ft?: string) => ft || <Tag>None</Tag>,
      },
      {
        title: 'Giá trị',
        key: 'values',
        render: (_, record) => record.values?.length ?? 0,
      },
      {
        title: 'Hành động',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditingAttr(record);
                attrForm.setFieldsValue({
                  code: record.code,
                  name: stringifyName(record.name),
                  filterType: record.filterType ?? undefined,
                });
                setAttrModalOpen(true);
              }}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              onClick={async () => {
                Modal.confirm({
                  title: `Xóa attribute ${record.code}?`,
                  okType: 'danger',
                  onOk: async () => {
                    try {
                      await deleteAttr.mutateAsync(record.id);
                      message.success('Đã xóa attribute');
                    } catch (err) {
                      message.error(err instanceof Error ? err.message : 'Lỗi khi xóa');
                    }
                  },
                });
              }}
            >
              Xóa
            </Button>
          </Space>
        ),
      },
    ],
    [attrForm, deleteAttr],
  );

  const handleSubmitAttribute = async () => {
    try {
      const values = await attrForm.validateFields();
      const payload = {
        code: values.code,
        name: { vi: values.name },
        filterType: values.filterType || undefined,
      };
      if (editingAttr) {
        await updateAttr.mutateAsync({ id: editingAttr.id, data: payload });
        message.success('Cập nhật attribute thành công');
      } else {
        await createAttr.mutateAsync(payload);
        message.success('Tạo attribute thành công');
      }
      setAttrModalOpen(false);
      setEditingAttr(null);
      attrForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi khi lưu attribute');
    }
  };

  const handleSubmitValue = async () => {
    if (!editingValue) return;
    const { attributeId, value } = editingValue;
    try {
      const values = await valueForm.validateFields();
      const payload = {
        value: { vi: values.value },
        metaValue: values.metaValue,
        order: values.order,
      };
      if (value) {
        await updateValue.mutateAsync({
          attributeId,
          valueId: value.id,
          data: payload,
        });
        message.success('Cập nhật value thành công');
      } else {
        await createValue.mutateAsync({ attributeId, data: payload });
        message.success('Thêm value thành công');
      }
      setValueModalOpen(false);
      setEditingValue(null);
      valueForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi khi lưu value');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 font-heading">Thuộc tính</h1>
          <p className="text-sm text-slate-500">
            Quản lý attribute và value (chỉ thêm/sửa; xóa attribute sẽ xóa toàn bộ value).
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="bg-linear-to-r from-amber-500 to-amber-600 border-none"
          onClick={() => {
            setEditingAttr(null);
            attrForm.resetFields();
            setAttrModalOpen(true);
          }}
        >
          Thêm attribute
        </Button>
      </div>

      <Card className="shadow-sm rounded-xl border-slate-100">
        <Table<Attribute>
          rowKey="id"
          loading={isLoading}
          columns={attrColumns}
          dataSource={attributes}
          expandable={{
            expandedRowRender: (record) => (
              <Collapse bordered={false} defaultActiveKey={['values']}>
                <Collapse.Panel header="Danh sách value" key="values">
                  <Space direction="vertical" className="w-full">
                    <Button
                      size="small"
                      type="dashed"
                      onClick={() => {
                        setEditingValue({ attributeId: record.id, value: null });
                        valueForm.resetFields();
                        setValueModalOpen(true);
                      }}
                    >
                      Thêm value
                    </Button>
                    <Table<AttributeValue>
                      size="small"
                      rowKey="id"
                      dataSource={record.values || []}
                      pagination={false}
                      columns={[
                        {
                          title: 'Value',
                          dataIndex: 'value',
                          render: (v: Record<string, string>) => stringifyName(v),
                        },
                        { title: 'Meta', dataIndex: 'metaValue', render: (v?: string) => v || '-' },
                        { title: 'Order', dataIndex: 'order', render: (v?: number | null) => v ?? '-' },
                        {
                          title: 'Hành động',
                          render: (_, v) => (
                            <Space>
                              <Button
                                type="link"
                                onClick={() => {
                                  setEditingValue({ attributeId: record.id, value: v });
                                  valueForm.setFieldsValue({
                                    value: stringifyName(v.value),
                                    metaValue: v.metaValue ?? undefined,
                                    order: v.order ?? undefined,
                                  });
                                  setValueModalOpen(true);
                                }}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="link"
                                danger
                                onClick={() =>
                                  Modal.confirm({
                                    title: 'Xóa value?',
                                    okType: 'danger',
                                    onOk: async () => {
                                      try {
                                        await deleteValue.mutateAsync({
                                          attributeId: record.id,
                                          valueId: v.id,
                                        });
                                        message.success('Đã xóa value');
                                      } catch (err) {
                                        message.error(err instanceof Error ? err.message : 'Lỗi khi xóa');
                                      }
                                    },
                                  })
                                }
                              >
                                Xóa
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </Space>
                </Collapse.Panel>
              </Collapse>
            ),
          }}
        />
      </Card>

      <Modal
        title={editingAttr ? 'Sửa attribute' : 'Thêm attribute'}
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
      >
        <Form form={attrForm} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Nhập code' }]}
          >
            <Input placeholder="e.g. material" disabled={!!editingAttr} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên (vi)"
            rules={[{ required: true, message: 'Nhập tên' }]}
          >
            <Input placeholder="Tên hiển thị" />
          </Form.Item>
          <Form.Item name="filterType" label="Filter Type">
            <Input placeholder="Tùy chọn, ví dụ: SELECT" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingValue?.value ? 'Sửa value' : 'Thêm value'}
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
        <Form form={valueForm} layout="vertical">
          <Form.Item
            name="value"
            label="Giá trị (vi)"
            rules={[{ required: true, message: 'Nhập giá trị' }]}
          >
            <Input placeholder="Ví dụ: Vàng, Bạc" />
          </Form.Item>
          <Form.Item name="metaValue" label="Meta value">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item name="order" label="Thứ tự">
            <Input type="number" placeholder="Optional" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


