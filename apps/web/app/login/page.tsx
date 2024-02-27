'use client';

import { Button, Input } from '@nextui-org/react';
import React, { useState } from 'react';
import { setAuthCode } from '../utils';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [codeValue, setCodeValue] = useState('');
  const router = useRouter();

  return (
    <div className="m-auto mt-[10vh] flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
      <Input
        value={codeValue}
        onValueChange={setCodeValue}
        label="AuthCode"
        placeholder="请输入auth code"
      />
      <Button
        color="primary"
        onPress={() => {
          setAuthCode(codeValue);
          router.push('/');
        }}
      >
        确认
      </Button>
    </div>
  );
};

export default LoginPage;
