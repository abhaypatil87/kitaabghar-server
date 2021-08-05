export default function escapeString(str: string) {
  return str.replaceAll("'", "''");
}
