// interface MainPageProps extends React.HTMLAttributes<HTMLDivElement> {
//
// }
import React from 'react';

type MainPageProps = React.HTMLAttributes<HTMLDivElement>
export default function MainPage({ children }: MainPageProps) {
  return (
    <div className={"flex flex-col items-center min-h-screen bg-gray-100 p-4"}>
      {children}
    </div>
  );
}