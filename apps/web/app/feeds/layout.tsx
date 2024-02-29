'use client';

import React, { use, useMemo, useState } from 'react';
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
  ListboxItem,
  Listbox,
  Avatar,
  ListboxSection,
  Divider,
  Switch,
  Tooltip,
} from '@nextui-org/react';
import { trpc } from '../trpc';
import { toast } from 'sonner';
import { PlusIcon } from '@web/components/PlusIcon';
import dayjs from 'dayjs';
import { useParams } from 'next/navigation';

const serverOriginUrl = process.env.NEXT_PUBLIC_SERVER_ORIGIN_URL;

const FeedLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { id } = useParams();
  // for children re-render
  const [childKey, setChildKey] = useState(0);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { refetch: refetchFeed, data: feedData } = trpc.feed.list.useQuery(
    {
      limit: 100,
    },
    {
      refetchOnWindowFocus: true,
    },
  );
  const { mutateAsync: getMpInfo, isLoading: isGetMpInfoLoading } =
    trpc.platform.getMpInfo.useMutation({});
  const { mutateAsync: updateMpInfo } = trpc.feed.edit.useMutation({});

  const { mutateAsync: addFeed, isLoading: isAddFeedLoading } =
    trpc.feed.add.useMutation({});
  const { mutateAsync: refreshMpArticles, isLoading: isGetArticlesLoading } =
    trpc.feed.refreshArticles.useMutation();

  const [wxsLink, setWxsLink] = useState('');

  const [currentMpId, setCurrentMpId] = useState(id?.[0] || '');

  const handleConfirm = async () => {
    // TODO show operation in progress
    const res = await getMpInfo({ wxsLink: wxsLink });
    if (res[0]) {
      const item = res[0];
      await addFeed({
        id: item.id,
        mpName: item.name,
        mpCover: item.cover,
        mpIntro: item.intro,
        updateTime: item.updateTime,
        status: 1,
      });
      await refreshMpArticles(item.id);

      toast.success('添加成功', {
        description: `公众号 ${item.name}`,
      });
      refetchFeed();
      setWxsLink('');
      onClose();
      setChildKey((prev) => prev + 1);
    } else {
      toast.error('添加失败', { description: '请检查链接是否正确' });
    }
  };

  const isActive = (key: string) => {
    return currentMpId === key;
  };

  const currentMpInfo = useMemo(() => {
    return feedData?.items.find((item) => item.id === currentMpId);
  }, [currentMpId, feedData?.items]);

  return (
    <>
      <div className="h-full flex justify-between">
        <div className="w-64 p-4 h-full">
          <div className="pb-4 flex justify-between align-middle items-center">
            <Button
              color="primary"
              size="sm"
              onPress={onOpen}
              endContent={<PlusIcon />}
            >
              添加
            </Button>
            <div className="font-normal text-sm">
              共{feedData?.items.length || 0}个订阅
            </div>
          </div>

          {feedData?.items ? (
            <Listbox
              aria-label="订阅源"
              emptyContent="暂无订阅"
              onAction={(key) => setCurrentMpId(key as string)}
            >
              <ListboxSection showDivider>
                <ListboxItem
                  key={''}
                  href={`/feeds`}
                  className={isActive('') ? 'bg-primary-50 text-primary' : ''}
                  startContent={<Avatar name="ALL"></Avatar>}
                >
                  全部
                </ListboxItem>
              </ListboxSection>

              <ListboxSection className="overflow-y-auto h-[calc(100vh-260px)]">
                {feedData?.items.map((item) => {
                  return (
                    <ListboxItem
                      href={`/feeds/${item.id}`}
                      className={
                        isActive(item.id) ? 'bg-primary-50 text-primary' : ''
                      }
                      key={item.id}
                      startContent={<Avatar src={item.mpCover}></Avatar>}
                    >
                      {item.mpName}
                    </ListboxItem>
                  );
                }) || []}
              </ListboxSection>
            </Listbox>
          ) : (
            ''
          )}
        </div>
        <div className="flex-1 h-full flex flex-col">
          <div className="p-4 pb-0 flex justify-between">
            <h3 className="text-medium font-mono flex-1 overflow-hidden text-ellipsis break-keep text-nowrap pr-1">
              {currentMpInfo?.mpName || '全部'}
            </h3>
            {currentMpInfo ? (
              <div className="flex h-5 items-center space-x-4 text-small">
                <div className="font-light">
                  最后更新时间:
                  {dayjs(currentMpInfo.syncTime * 1e3).format(
                    'YYYY-MM-DD HH:mm:ss',
                  )}
                </div>
                <Divider orientation="vertical" />
                <Link
                  size="sm"
                  href="#"
                  isDisabled={isGetArticlesLoading}
                  onClick={async (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    await Promise.all([
                      refreshMpArticles(currentMpInfo.id),
                      refetchFeed(),
                    ]);
                    setChildKey((prev) => prev + 1);
                  }}
                >
                  {isGetArticlesLoading ? '更新中...' : '立即更新'}
                </Link>
                <Divider orientation="vertical" />

                <Tooltip content="启用服务端定时更新">
                  <div>
                    <Switch
                      size="sm"
                      onValueChange={async (value) => {
                        await updateMpInfo({
                          id: currentMpInfo.id,
                          data: {
                            status: value ? 1 : 0,
                          },
                        });

                        await refetchFeed();
                      }}
                      isSelected={currentMpInfo?.status === 1}
                    ></Switch>
                  </div>
                </Tooltip>
                <Divider orientation="vertical" />
                <Link
                  size="sm"
                  showAnchorIcon
                  target="_blank"
                  href={`${serverOriginUrl}/feeds/${currentMpInfo.id}`}
                  color="foreground"
                >
                  RSS
                </Link>
              </div>
            ) : (
              <Link
                size="sm"
                showAnchorIcon
                target="_blank"
                href={`${serverOriginUrl}/feeds/all.atom`}
                color="foreground"
              >
                RSS
              </Link>
            )}
          </div>
          <div className="p-2 overflow-y-auto" key={childKey}>
            {children}
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                添加公众号源
              </ModalHeader>
              <ModalBody>
                <Textarea
                  value={wxsLink}
                  onValueChange={setWxsLink}
                  autoFocus
                  label="分享链接"
                  placeholder="输入公众号文章分享链接，如 https://mp.weixin.qq.com/s/xxxxxx"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="primary"
                  isDisabled={
                    !wxsLink.startsWith('https://mp.weixin.qq.com/s/')
                  }
                  onPress={handleConfirm}
                  isLoading={
                    isAddFeedLoading ||
                    isGetMpInfoLoading ||
                    isGetArticlesLoading
                  }
                >
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default FeedLayout;
