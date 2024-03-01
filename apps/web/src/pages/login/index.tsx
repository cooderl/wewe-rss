import { Button, Input } from '@nextui-org/react';
import { setAuthCode } from '@web/utils/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [codeValue, setCodeValue] = useState('');

  const navigate = useNavigate();

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
          navigate('/');
        }}
      >
        确认
      </Button>
    </div>
  );
};

export default LoginPage;
