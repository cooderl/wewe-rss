import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@nextui-org/react';
import { statusMap } from '@web/constants';

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
          {statusMap[value].label}
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
        {Object.entries(statusMap).map(([key, value]) => {
          return (
            <DropdownItem color={value.color} key={`${key}`} value={`${key}`}>
              {value.label}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
