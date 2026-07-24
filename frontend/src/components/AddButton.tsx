import Button from './Button.tsx';

type AddButtonProps = React.ComponentPropsWithoutRef<'button'>
import React from 'react';

export default function AddButton({ ...props }: AddButtonProps) {
  return (
    <Button
      children={<svg className="h-5 w-5" >
                  <use href="/icons.svg#add-icon" />
                </svg>}
      variant={'add'} size={'md'} {...props} />
  );
}