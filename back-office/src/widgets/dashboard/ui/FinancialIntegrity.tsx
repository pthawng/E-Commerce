import React from 'react';
import { Typography, Badge, Button, message } from 'antd';
import { SecurityScanOutlined, LoadingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerApi } from '@/entities/ledger/api/ledgerApi';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export const FinancialIntegrity: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { data: kpis, isLoading } = useQuery({
        queryKey: ['ledger-kpis'],
        queryFn: () => ledgerApi.getKPIs(),
        refetchInterval: 30000,
    });

    const auditMutation = useMutation({
        mutationFn: () => ledgerApi.runAudit(),
        onSuccess: data => {
            if (data.issuesFound > 0) {
                message.warning(t('dashboard.integrity.audit_success_issues', { count: data.issuesFound }));
            } else {
                message.success(t('dashboard.integrity.audit_success_healthy'));
            }
            queryClient.invalidateQueries({ queryKey: ['ledger-kpis'] });
        },
        onError: () => {
            message.error(t('dashboard.integrity.audit_failed'));
        },
    });

    const hasIssues = (kpis?.activeDiscrepancies || 0) > 0;

    return (
        <div className="space-y-6">
            <Text className="tracking-[0.2em] uppercase text-[11px] text-black dark:text-white font-black block">
                {t('dashboard.integrity.title')}
            </Text>

            <div
                className={`bg-[#fcfcfc] dark:bg-white/[0.04] p-8 border-2 transition-colors duration-500 space-y-6 ${
                    hasIssues ? 'border-red-600 animate-pulse' : 'border-black dark:border-white'
                }`}
            >
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                    <Text className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {t('dashboard.integrity.physical_status')}
                    </Text>
                    {isLoading ? (
                        <LoadingOutlined className="text-gray-400" />
                    ) : (
                        <Badge
                            status={hasIssues ? 'error' : 'success'}
                            text={
                                <span
                                    className={`text-[10px] font-black uppercase ${
                                        hasIssues ? 'text-red-600' : 'text-green-700 dark:text-green-400'
                                    }`}
                                >
                                    {hasIssues
                                        ? t('dashboard.integrity.discrepancy_found', {
                                              count: kpis?.activeDiscrepancies,
                                          })
                                        : t('dashboard.integrity.match_confirmed')}
                                </span>
                            }
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Text className="text-[11px] text-gray-900 dark:text-gray-100 leading-relaxed block font-medium">
                        {hasIssues
                            ? t('dashboard.integrity.mismatch_desc')
                            : t('dashboard.integrity.healthy_desc')}
                    </Text>
                    <Text
                        className={`text-[10px] italic block ${
                            hasIssues ? 'text-red-500 font-bold' : 'text-gray-500'
                        }`}
                    >
                        {t('dashboard.integrity.discrepancy_rate')}: {hasIssues ? '> 0.0000%' : '0.0000%'}
                    </Text>
                </div>

                <Button
                    block
                    icon={auditMutation.isPending ? <LoadingOutlined /> : <SecurityScanOutlined />}
                    disabled={auditMutation.isPending}
                    onClick={() => auditMutation.mutate()}
                    className={`h-12 border-none rounded-none text-[10px] uppercase font-black tracking-[0.2em] transition-all ${
                        hasIssues
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90'
                    }`}
                >
                    {auditMutation.isPending
                        ? t('dashboard.integrity.auditing_engine')
                        : t('dashboard.integrity.run_audit')}
                </Button>
            </div>
        </div>
    );
};
