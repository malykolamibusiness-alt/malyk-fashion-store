type BrandWordmarkProps = {
  className?: string;
};

export function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  return <span className={`brand-wordmark ${className}`.trim()}>MALYK</span>;
}
