import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@nextui-org/react';

const statusMap = {
  0: '失效',
  1: '启用',
  2: '禁用',
};

export function StatusDropdown({
  value = 1,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button size="sm" variant="bordered" className="capitalize">
          {statusMap[value]}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disabledKeys={['0']}
        aria-label="状态设置"
        variant="flat"
        disallowEmptySelection
        selectionMode="single"
        selectedKeys={[`${value}`]}
        onSelectionChange={(keys) => {
          onChange(+Array.from(keys)[0]);
        }}
      >
        {Object.entries(statusMap).map(([value, label]) => {
          return (
            <DropdownItem key={`${value}`} value={`${value}`}>
              {label}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
