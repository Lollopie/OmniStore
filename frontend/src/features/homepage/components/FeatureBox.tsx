interface FeatureBoxProps {
  svgName: string;
  text: string;
}
export default function FeatureBox({ svgName, text }: FeatureBoxProps) {
  return (
    <div className="basis-1/6 border-2 border-accent rounded-lg p-3 pt-7 flex flex-col justify-start items-center">
      <p className="text-3xl font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <use href={`/icons.svg#${svgName}`} />
        </svg>
      </p>
      <p className="pt-5 rounded-lg p-5 text-lg text-center">
        {text}
      </p>
    </div>
  );
}