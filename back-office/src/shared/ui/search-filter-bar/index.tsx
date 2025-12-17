import { Button, Form, Input, Popover, Select, Badge } from 'antd';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

export type FilterType = 'select' | 'input';

export interface FilterConfig {
    key: string;
    label: string;
    type: FilterType;
    options?: { label: string; value: any }[];
    placeholder?: string;
}

interface Props {
    onSearch: (val: string) => void;
    onFilter: (values: Record<string, any>) => void;
    config?: FilterConfig[];
    defaultValue?: string;
    defaultFilters?: Record<string, any>;
    placeholder?: string;
}

export function SearchFilterBar({
    onSearch,
    onFilter,
    config = [],
    defaultValue = '',
    defaultFilters = {},
    placeholder = 'Tìm kiếm...'
}: Props) {
    const [searchValue, setSearchValue] = useState(defaultValue);
    const [filterOpen, setFilterOpen] = useState(false);
    const [form] = Form.useForm();

    // Calculate active filters count (non-empty values)
    const activeFiltersCount = Object.values(defaultFilters || {}).filter(
        v => v !== undefined && v !== null && v !== ''
    ).length;

    // Sync state if props change (e.g. reset from parent)
    useEffect(() => {
        setSearchValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        form.setFieldsValue(defaultFilters);
    }, [defaultFilters, form]);

    const handleSearch = () => {
        onSearch(searchValue);
    };

    const handleApplyFilters = (values: any) => {
        // Cleaning undefined/empty
        const clean = Object.fromEntries(
            Object.entries(values).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
        );
        onFilter(clean);
        setFilterOpen(false);
    };

    const handleResetFilters = () => {
        form.resetFields();
        onFilter({});
        setFilterOpen(false);
    };

    const filterContent = (
        <div className="w-80">
            <Form
                form={form}
                layout="vertical"
                initialValues={defaultFilters}
                onFinish={handleApplyFilters}
            >
                {config.map(field => (
                    <Form.Item key={field.key} name={field.key} label={field.label} className="mb-3">
                        {field.type === 'select' ? (
                            <Select
                                placeholder={field.placeholder || field.label}
                                options={field.options}
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        ) : (
                            <Input placeholder={field.placeholder || field.label} />
                        )}
                    </Form.Item>
                ))}

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Button onClick={handleResetFilters} size="small">Đặt lại</Button>
                    <Button type="primary" htmlType="submit" size="small">Áp dụng</Button>
                </div>
            </Form>
        </div>
    );

    return (
        <div className="flex gap-3">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <SearchOutlined className="text-slate-400 group-focus-within:text-indigo-500 transition-colors text-lg" />
                </div>
                <Input
                    className="pl-10 pr-16 bg-white border-slate-200 hover:border-indigo-300 focus:border-indigo-500 h-11 rounded-xl shadow-sm transition-all"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onPressEnter={handleSearch}
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <Button
                        type="text"
                        size="small"
                        className="text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 h-8"
                        onClick={handleSearch}
                    >
                        Tìm
                    </Button>
                </div>
            </div>

            {config.length > 0 && (
                <Popover
                    content={filterContent}
                    trigger="click"
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    placement="bottomRight"
                    arrow={false}
                >
                    <Badge count={activeFiltersCount} size="small" offset={[-5, 5]}>
                        <Button
                            icon={<FilterOutlined />}
                            className={`h-11 px-4 rounded-xl border font-medium transition-all flex items-center gap-2
                                ${filterOpen || activeFiltersCount > 0
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            Bộ lọc
                        </Button>
                    </Badge>
                </Popover>
            )}
        </div>
    );
}
