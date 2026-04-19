import { queryDb } from '../src/lib/db';
(async () => {
  try {
    const personas = await queryDb(`SELECT Id, Name, Username FROM Personas LIMIT 10`);
    console.log('Personas:', personas);
  } catch (e) {
    console.error('Error:', e);
  }
})();
