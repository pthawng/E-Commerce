import { Modal, Form, InputNumber, Input, Checkbox } from 'antd';
import { useRefundPayment } from '../hooks/usePayments';
import { useState } from 'react';

interface RefundModalProps {
    visible: boolean;
    orderId: string;
    orderCode: string;
    currentAmount: number;
    onClose: () => void;
}

export const RefundModal = ({ visible, orderId, orderCode, currentAmount, onClose }: RefundModalProps) => {
    const [form] = Form.useForm();
    const refundPayment = useRefundPayment();
    const [restoreInventory, setRestoreInventory] = useState(true);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await refundPayment.mutateAsync({
                orderId,
                data: {
                    amount: values.amount,
                    reason: values.reason,
                    restoreInventory,
                },
            });
            form.resetFields();
            setRestoreInventory(true);
            onClose();
        } catch (error) {
            // Validation error or mutation error
            console.error('Refund error:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setRestoreInventory(true);
        onClose();
    };

    return (
        <Modal
            title="Process Refund"
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={refundPayment.isPending}
            okText="Process Refund"
            cancelText="Cancel"
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Order Code">
                    <Input value={orderCode} disabled />
                </Form.Item>

                <Form.Item label="Current Amount">
                    <InputNumber
                        value={currentAmount}
                        disabled
                        style={{ width: '100%' }}
                        formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                </Form.Item>

                <Form.Item
                    name="amount"
                    label="Refund Amount"
                    rules={[
                        { required: true, message: 'Please enter refund amount' },
                        {
                            type: 'number',
                            min: 1,
                            max: currentAmount,
                            message: `Amount must be between 1 and ${currentAmount}`,
                        },
                    ]}
                    initialValue={currentAmount}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter refund amount"
                        formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value!.replace(/₫\s?|(,*)/g, '')}
                    />
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Refund Reason"
                    rules={[
                        { required: true, message: 'Please provide a reason' },
                        { min: 10, message: 'Reason must be at least 10 characters' },
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Enter reason for refund (min 10 characters)..."
                    />
                </Form.Item>

                <Form.Item>
                    <Checkbox
                        checked={restoreInventory}
                        onChange={(e) => setRestoreInventory(e.target.checked)}
                    >
                        Restore inventory (return items to stock)
                    </Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};
