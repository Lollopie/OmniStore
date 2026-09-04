// interface MainPageProps extends React.HTMLAttributes<HTMLDivElement> {
//
// }
import React from 'react';

type MainPageProps = React.HTMLAttributes<HTMLDivElement>
export default function MainPage({ children }: MainPageProps) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}