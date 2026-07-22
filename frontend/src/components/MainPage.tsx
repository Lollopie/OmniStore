// interface MainPageProps extends React.HTMLAttributes<HTMLDivElement> {
//
// }
import React from 'react';

type MainPageProps = React.HTMLAttributes<HTMLDivElement>
export default function MainPage({ children }: MainPageProps) {
  return (
    <div className={"h-full flex flex-col items-center bg-base-200 p-4"}>
      {children}
    </div>
  );
}