import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}

const BASE = "https://mylactest.com";

const Seo = ({ title, description, path, noindex }: SeoProps) => {
  const url = path ? `${BASE}${path}` : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};

export default Seo;
