'use client';

import ModalContentWrapper from '@/components/ModalContentWrapper';
import ModalWrapper from '@/components/ModalWrapper';
import Button from '@/components/ui/Button';
import { Close } from '@/svg_components';
import { AnimatePresence } from 'framer-motion';
import { createContext, useState } from 'react';

const BasicDialogsContext = createContext<{
  shown: boolean;
  alert: ({ title, message }: { title: string; message: string }) => void;
  confirm: ({
    title,
    message,
    actionOnConfirm,
  }: {
    title: string;
    message: string;
    actionOnConfirm: Function;
  }) => void;
}>({
  shown: false,
  alert: () => {},
  confirm: () => {},
});

function BasicDialogsContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);
  const [dialog, setDialog] = useState<{
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    actionOnConfirm?: Function;
  }>({
    type: 'alert',
    title: '',
    message: '',
  });

  const show = () => {
    setShown(true);
  };

  const hide = () => {
    setShown(false);
  };

  const alert = ({ title, message }: { title: string; message: string }) => {
    setDialog({
      type: 'alert',
      title,
      message,
    });
    show();
  };

  const confirm = ({
    title,
    message,
    actionOnConfirm,
  }: {
    title: string;
    message: string;
    actionOnConfirm: Function;
  }) => {
    setDialog({
      type: 'confirm',
      title,
      message,
      actionOnConfirm,
    });
    show();
  };

  return (
    <BasicDialogsContext.Provider value={{ shown: shown, alert, confirm }}>
      <AnimatePresence>
        {shown && (
          <ModalWrapper key="modal-wrapper">
            <ModalContentWrapper>
              <Close
                className="absolute top-6 md:top-8 right-6 md:right-8 cursor-pointer stroke-gray-900 hover:stroke-gray-500"
                width={24}
                height={24}
                onClick={hide}
              />
              <h1 className="text-center text-4xl md:text-5xl font-bold">
                {dialog.title}
              </h1>
              <p className="text-lg text-center text-gray-700">
                {dialog.message}
              </p>
              <Button
                onClick={() => {
                  hide();
                  dialog.type === 'alert'
                    ? hide()
                    : dialog.actionOnConfirm && dialog.actionOnConfirm();
                }}
                shape="pill"
                size="long"
              >
                {dialog.type === 'alert' ? 'Okay' : 'Confirm'}
              </Button>
              {dialog.type === 'confirm' && (
                <Button onClick={hide} shape="pill" size="long" mode="ghost">
                  Cancel
                </Button>
              )}
            </ModalContentWrapper>
          </ModalWrapper>
        )}
      </AnimatePresence>
      {children}
    </BasicDialogsContext.Provider>
  );
}

export { BasicDialogsContext, BasicDialogsContextProvider };