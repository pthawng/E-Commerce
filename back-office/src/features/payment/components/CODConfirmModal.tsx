import { Modal, Form, Input, InputNumber } from 'antd';
import { useConfirmCOD } from '../hooks/usePayments';

interface CODConfirmModalProps {
    visible: boolean;
    orderId: string;
    orderCode: string;
    amount: number;
    onClose: () => void;
}

export const CODConfirmModal = ({ visible, orderId, orderCode, amount, onClose }: CODConfirmModalProps) => {
    const [form] = Form.useForm();
    const confirmCOD = useConfirmCOD();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await confirmCOD.mutateAsync({
                orderId,
                amount,
                note: values.note,
            });
            form.resetFields();
            onClose();
        } catch (error) {
            console.error('COD confirmation error:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Confirm COD Payment"
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={confirmCOD.isPending}
            okText="Confirm Payment"
            cancelText="Cancel"
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Order Code">
                    <Input value={orderCode} disabled />
                </Form.Item>

                <Form.Item label="Amount">
                    <InputNumber
                        value={amount}
                        disabled
                        style={{ width: '100%' }}
                        formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                </Form.Item>

                <Form.Item
                    name="note"
                    label="Note (Optional)"
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Add any notes about this payment confirmation..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
