import Button from './Button.tsx';

type AddButtonProps = React.ComponentPropsWithoutRef<'button'>
import React from 'react';
import { publicAsset } from '../utils/publicAsset.ts';

export default function AddButton({ ...props }: AddButtonProps) {
  return (
    <Button
      children={<svg className="h-5 w-5" >
                  <use href={publicAsset('icons.svg#add-icon')} />
                </svg>}
      variant={'add'} size={'md'} {...props} />
  );
}