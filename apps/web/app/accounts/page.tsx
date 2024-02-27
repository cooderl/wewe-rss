'use client';

import React, { useEffect, useState } from 'react';
import { trpc } from '../trpc';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Checkbox,
  Input,
  Link,
  Textarea,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { PlusIcon } from '@web/components/PlusIcon';
import dayjs from 'dayjs';
import { StatusDropdown } from '@web/components/StatusDropdown';

const AccountPage = () => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const { refetch, data, isFetching } = trpc.account.list.useQuery({
    limit: 100,
  });

  const { mutateAsync: updateAccount } = trpc.account.edit.useMutation({});

  const { mutateAsync: deleteAccount } = trpc.account.delete.useMutation({});

  const { mutateAsync: addAccount } = trpc.account.add.useMutation({});

  const { mutateAsync, data: loginData } =
    trpc.platform.createLoginUrl.useMutation();

  trpc.platform.getLoginResult.useQuery(
    {
      id: loginData?.uuid ?? '',
    },
    {
      refetchInterval: (data) => {
        if (data?.message === 'waiting') {
          return 2000;
        }
        return false;
      },
      refetchIntervalInBackground: true,
      enabled: !!loginData?.uuid,
      async onSuccess(data) {
        if (data.message === 'success') {
          const name = data.username!;

          if (data.vid && data.token) {
            await addAccount({ id: `${data.vid}`, name, token: data.token });

            onClose();
            toast.success('添加成功', {
              description: `用户名：${name}(${data.vid})`,
            });
            refetch();
          }
        }
      },
    },
  );

  return (
    <div>
      <div className="flex justify-between m-4">
        <div className="font-bold">共{data?.items.length || 0}个账号</div>
        <Button
          onPress={() => {
            onOpen();
            mutateAsync();
          }}
          size="sm"
          color="primary"
          endContent={<PlusIcon />}
        >
          添加读书账号
        </Button>
      </div>
      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>用户名</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>更新时间</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={<div className="m-auto text-center">暂无数据</div>}
          isLoading={isFetching}
          loadingContent={<Spinner />}
        >
          {data?.items.map((item) => {
            return (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <StatusDropdown
                    value={item.status}
                    onChange={(value) => {
                      updateAccount({
                        id: item.id,
                        data: { status: value },
                      }).then(() => {
                        toast.success('更新成功!');
                        refetch();
                      });
                    }}
                  ></StatusDropdown>
                </TableCell>
                <TableCell>
                  {dayjs(item.updatedAt).format('YYYY-MM-DD')}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="danger"
                    onPress={() => {
                      deleteAccount(item.id).then(() => {
                        toast.success('删除成功!');
                        refetch();
                      });
                    }}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            );
          }) || []}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                添加读书账号
              </ModalHeader>
              <ModalBody>
                <div className="m-auto pb-8 text-center">
                  {loginData ? (
                    <div>
                      <QRCodeSVG size={150} value={loginData?.scanUrl} />
                      <div className="mt-4">微信扫码登录</div>
                    </div>
                  ) : (
                    <div className="m-auto flex justify-center align-middle items-center">
                      <Spinner />
                      loading...
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AccountPage;
