'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Button,
  Spinner,
  Link,
  Avatar,
} from '@nextui-org/react';
import { trpc } from '@web/app/trpc';
import dayjs from 'dayjs';

const FeedPage = ({ params }: { params: { id: string[] } }) => {
  const mpId = params.id?.[0] || '';
  const [cursor, setCursor] = useState('');

  const [data, setData] = useState<{
    items: {
      id: string;
      createdAt: string;
      updatedAt: string | null;
      mpId: string;
      title: string;
      picUrl: string;
      publishTime: number;
    }[];
    nextCursor?: string | null;
  }>({} as any);

  const { isLoading } = trpc.article.list.useQuery(
    {
      mpId,
      limit: 20,
      cursor,
    },
    {
      onSuccess(data) {
        setData((prev) => ({
          items: [...(prev.items || []), ...data.items],
          nextCursor: data.nextCursor,
        }));
      },
    },
  );

  return (
    <div>
      <Table
        classNames={{
          base: 'h-full',
          table: 'min-h-[420px]',
        }}
        aria-label="文章列表"
        bottomContent={
          data?.nextCursor && !isLoading ? (
            <div className="flex w-full justify-center">
              <Button
                isDisabled={isLoading}
                variant="flat"
                onPress={() => {
                  setCursor(data.nextCursor!);
                }}
              >
                {isLoading && <Spinner color="white" size="sm" />}
                Load More
              </Button>
            </div>
          ) : null
        }
      >
        <TableHeader>
          <TableColumn key="title">标题</TableColumn>
          <TableColumn width={180} key="publishTime">
            发布时间
          </TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          emptyContent={'暂无数据'}
          items={data?.items || []}
          loadingContent={<Spinner />}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                let value = getKeyValue(item, columnKey);

                if (columnKey === 'publishTime') {
                  value = dayjs(value * 1e3).format('YYYY-MM-DD HH:mm:ss');
                  return <TableCell>{value}</TableCell>;
                }

                if (columnKey === 'title') {
                  return (
                    <TableCell>
                      <Link
                        className="visited:text-neutral-400"
                        isBlock
                        showAnchorIcon
                        color="foreground"
                        target="_blank"
                        href={`https://mp.weixin.qq.com/s/${item.id}`}
                      >
                        {value}
                      </Link>
                    </TableCell>
                  );
                }
                return <TableCell>{value}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FeedPage;
