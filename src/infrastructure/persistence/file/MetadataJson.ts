enum MetadataFields {
  'row-order' = 'row-order',
  'column-order' = 'column-order',
  'footnotes' = 'footnotes',
}

type MetadataJson = {
  [key in MetadataFields]: string[];
};

export type { MetadataJson };
