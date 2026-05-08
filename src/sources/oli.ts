export interface OLILabel {
  displayName: string | null;
  primaryCategory: string | null;
}

export async function fetchOLILabel(address: string): Promise<OLILabel | null> {
  const apiKey = process.env.OLI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.openlabelsinitiative.org/api/v1/labels?address=${address}&limit=10`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      address: string;
      labels: { tag_id: string; tag_value: string }[];
    };

    const nameLabel = data.labels.find((l) => l.tag_id === 'contract_name' || l.tag_id === 'name');
    const catLabel = data.labels.find((l) => l.tag_id === 'usage_category');

    return {
      displayName: nameLabel?.tag_value ?? null,
      primaryCategory: catLabel?.tag_value ?? null,
    };
  } catch {
    return null;
  }
}
