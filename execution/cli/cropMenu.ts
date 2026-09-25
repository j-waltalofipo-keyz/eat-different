// npm run assets:menu-crops — cuts the dish photos out of reference/menu.jpg into public/images/.
import { cropMenu, loadCropSpec } from "../assets/cropMenu";

for (const file of await cropMenu(loadCropSpec(), "public/images")) console.log(`✅ ${file}`);
