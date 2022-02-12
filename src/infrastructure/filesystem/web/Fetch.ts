type Fetch = (url: string) => Promise<{ text(): Promise<string> }>;
export type { Fetch };
