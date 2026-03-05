/**
 * SplitLayout — Master-Detail split panel component.
 *
 * When `detail` is null: table fills full width.
 * When `detail` is provided: table takes ~55% left, detail panel takes ~45% right.
 *
 * Usage:
 *   <SplitLayout
 *     table={<MyTable onSelect={setSelected} selected={selected} />}
 *     detail={selected ? <MyDetailPanel item={selected} onClose={() => setSelected(null)} /> : null}
 *   />
 */
import React from 'react';

interface SplitLayoutProps {
    table: React.ReactNode;
    detail: React.ReactNode;
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({ table, detail }) => {
    const hasDetail = !!detail;

    return (
        <div
            style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                transition: 'all 0.2s ease',
                minHeight: 400,
            }}
        >
            {/* Master (table) */}
            <div
                style={{
                    flex: hasDetail ? '0 0 55%' : '1',
                    minWidth: 0,
                    transition: 'flex 0.2s ease',
                    overflow: 'hidden',
                }}
            >
                {table}
            </div>

            {/* Detail panel */}
            {hasDetail && (
                <div
                    style={{
                        flex: '0 0 calc(45% - 16px)',
                        minWidth: 0,
                        borderLeft: '1px solid #f0f0f0',
                        paddingLeft: 16,
                        animation: 'slideIn 0.18s ease',
                    }}
                >
                    {detail}
                </div>
            )}
        </div>
    );
};
