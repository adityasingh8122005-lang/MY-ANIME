export async function getFranchiseData(malId) {
  try {
    const res = await fetch(`/api/franchise?malId=${malId}`);
    if (!res.ok) throw new Error("Failed to fetch franchise");
    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
