"""
server/app/routes/breeds.py
API routes for the searchable Breed Library.
Provides verified ICAR-NBAGR / Hugging Face dataset breed characteristics for all 41 bovine classes.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from server.app.schemas.schemas import BreedItem
from server.app.services.inference.postprocess import determine_animal_type

router = APIRouter(prefix="/api/breeds", tags=["Breed Library"])

# Canonical breed metadata database for all 41 classes
BREED_METADATA = {
    "Alambadi": {
        "region": "Tamil Nadu (Dharmapuri, Salem)",
        "purpose": "Draught",
        "coat_color": "Grey or dark grey with white markings",
        "horn_type": "Backward-sweeping backward-pointing horns",
        "characteristics": "Hardy draught breed of the Kaveri river basin, renowned for stamina in rough terrain."
    },
    "Amritmahal": {
        "region": "Karnataka (Hassan, Chikmagalur, Chitradurga)",
        "purpose": "Draught",
        "coat_color": "Grey ranging from almost white to nearly black",
        "horn_type": "Long, emerging upward and backward, curving inward",
        "characteristics": "Historic warrior cattle bred by the Maharajas of Mysore for high endurance and quick march."
    },
    "Ayrshire": {
        "region": "Scotland (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Red and white patches",
        "horn_type": "Lyre-shaped upright horns",
        "characteristics": "Hardy exotic dairy breed known for milk quality and grazing efficiency in hilly pastures."
    },
    "Banni": {
        "region": "Gujarat (Kachchh - Banni grassland)",
        "purpose": "Dairy",
        "coat_color": "Black, brown, or copper",
        "horn_type": "Tightly coiled vertical horns",
        "characteristics": "Resilient buffalo breed adapted to night grazing in saline arid rangelands; high milk yield."
    },
    "Bargur": {
        "region": "Tamil Nadu (Erode - Bargur hills)",
        "purpose": "Draught",
        "coat_color": "Brown with distinct white spots and specks",
        "horn_type": "Light brown, swept backward over shoulders",
        "characteristics": "Spirited and agile hill cattle maintained by the Lingayat community for terrace farming."
    },
    "Bhadawari": {
        "region": "Uttar Pradesh & MP (Chambal ravine)",
        "purpose": "Dairy & Draught",
        "coat_color": "Copper or light reddish-brown (wheat-straw)",
        "horn_type": "Curled backward alongside the neck",
        "characteristics": "World-famous buffalo for highest milk fat percentage (up to 13%), highly efficient on coarse roughage."
    },
    "Brown_Swiss": {
        "region": "Switzerland (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Solid brown/greyish with light muzzle ring",
        "horn_type": "Short to medium curved forward",
        "characteristics": "Dual-purpose exotic dairy breed prized for milk with optimal protein-to-fat ratio for cheesemaking."
    },
    "Dangi": {
        "region": "Maharashtra & Gujarat (Western Ghats)",
        "purpose": "Draught",
        "coat_color": "Distinct red-and-white or black-and-white dappled coat",
        "horn_type": "Short, thick, laterally outward",
        "characteristics": "Known for unique oily skin secretion that repels heavy tropical monsoon downpours."
    },
    "Deoni": {
        "region": "Maharashtra & Karnataka (Marathwada)",
        "purpose": "Dual-purpose (Milk & Draught)",
        "coat_color": "Spotted black and white with pendulous dewlap",
        "horn_type": "Medium, emerging outward and slightly curving upward",
        "characteristics": "Popular dual-purpose breed derived from Gir, Dangi, and local cattle crosses."
    },
    "Gir": {
        "region": "Gujarat (Gir forest, Junagadh, Rajkot)",
        "purpose": "Dairy",
        "coat_color": "Red, speckled red, or white with dark red patches",
        "horn_type": "Half-moon shaped curving backward and downward",
        "characteristics": "World-renowned milch breed with distinct domed forehead, long pendulous ears, and high heat tolerance."
    },
    "Guernsey": {
        "region": "Channel Islands (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Fawn with white markings",
        "horn_type": "Short graceful curved horns",
        "characteristics": "Exotic dairy breed famous for golden-colored milk rich in beta-carotene and A2 beta-casein."
    },
    "Hallikar": {
        "region": "Karnataka (Mysore, Mandya, Tumkur)",
        "purpose": "Draught",
        "coat_color": "Dark grey with white markings on face and legs",
        "horn_type": "Long, emerging close together, pointing backward and upward",
        "characteristics": "Premier South Indian trotting draught cattle, source ancestor of Amritmahal and Khillari."
    },
    "Hariana": {
        "region": "Haryana & Western UP (Rohtak, Hisar)",
        "purpose": "Dual-purpose (Milk & Draught)",
        "coat_color": "White to light grey",
        "horn_type": "Short to medium, curving upward and inward",
        "characteristics": "Sturdy dual-purpose North Indian breed with narrow face, alert disposition, and strong bullocks."
    },
    "Holstein_Friesian": {
        "region": "Netherlands / Europe (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Striking piebald black and white patches",
        "horn_type": "Short curving forward",
        "characteristics": "Highest milk-producing dairy breed in the world, widely used in crossbreeding across Indian dairy co-ops."
    },
    "Jaffrabadi": {
        "region": "Gujarat (Gir & Saurashtra coast)",
        "purpose": "Dairy",
        "coat_color": "Deep black",
        "horn_type": "Heavy drooping horns curling downward past the eyes",
        "characteristics": "Heaviest of all Indian buffalo breeds, producing high quantities of rich butterfat milk."
    },
    "Jersey": {
        "region": "Channel Islands (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Light fawn to dark brown/mulberry",
        "horn_type": "Short curved horns",
        "characteristics": "Small-framed, heat-tolerant European dairy breed producing milk exceptionally rich in butterfat."
    },
    "Kangayam": {
        "region": "Tamil Nadu (Coimbatore, Erode, Tirupur)",
        "purpose": "Draught",
        "coat_color": "Bulls dark grey; cows white to light grey",
        "horn_type": "Straight and sharp, pointing outward and backward",
        "characteristics": "Famous draught breed of South India, celebrated in traditional Jallikattu cultural events."
    },
    "Kankrej": {
        "region": "Gujarat & Rajasthan (Rann of Kachchh)",
        "purpose": "Dual-purpose (Milk & Heavy Draught)",
        "coat_color": "Silver-grey to iron-grey with darker shoulders",
        "horn_type": "Majestic lyre-shaped horns with distinct curve",
        "characteristics": "Largest Indian zebu breed, famous for peculiar fast gait called '1 1/4 pace' (Sawai Chaal)."
    },
    "Kasargod": {
        "region": "Kerala (Kasargod district)",
        "purpose": "Draught & Manure",
        "coat_color": "Black, brown, or variegated",
        "horn_type": "Short horns curving forward and inward",
        "characteristics": "Miniature indigenous cattle known for extreme disease resistance and minimal feeding requirements."
    },
    "Kenkatha": {
        "region": "UP & MP (Bundelkhand, Ken river)",
        "purpose": "Draught",
        "coat_color": "Grey on neck, dark grey body",
        "horn_type": "Forward-directed horns",
        "characteristics": "Small, sturdy cattle thriving on sparse Vindhyan scrub forests and rugged terrain."
    },
    "Kherigarh": {
        "region": "Uttar Pradesh (Lakhimpur Kheri)",
        "purpose": "Draught",
        "coat_color": "White with narrow face",
        "horn_type": "Upward curving horns",
        "characteristics": "Active light draught cattle specialized for fast carting and plowing in the Tarai belt."
    },
    "Khillari": {
        "region": "Maharashtra & Karnataka (Solapur, Satara)",
        "purpose": "Heavy Draught",
        "coat_color": "Greyish-white with pinkish skin muzzle",
        "horn_type": "Long, emerging backward and upward with sharp tips",
        "characteristics": "Fast and powerful draught animal bred in drought-prone Deccan plateau, exceptionally spirited."
    },
    "Krishna_Valley": {
        "region": "Karnataka & Maharashtra (Krishna river basin)",
        "purpose": "Heavy Draught & Tillage",
        "coat_color": "Greyish-white with dark forequarters",
        "horn_type": "Small, thick horns curved slightly upward",
        "characteristics": "Heavy draught cattle bred for deep plowing in thick black cotton soils of the Deccan."
    },
    "Malnad_gidda": {
        "region": "Karnataka (Western Ghats - Malnad)",
        "purpose": "Dual-purpose & Manure",
        "coat_color": "Black, brown, or reddish",
        "horn_type": "Small, straight upward pointing",
        "characteristics": "Dwarf breed highly adapted to steep forested terrain and heavy rainfall; rich A2 milk."
    },
    "Mehsana": {
        "region": "Gujarat (Mehsana, Banaskantha, Sabarkantha)",
        "purpose": "Dairy",
        "coat_color": "Black to brownish-black",
        "horn_type": "Hook-like curve, less tightly curled than Murrah",
        "characteristics": "Renowned high-yield dairy buffalo developed from crossing Murrah with Surti varieties."
    },
    "Murrah": {
        "region": "Haryana & Punjab (Rohtak, Jind, Hisar)",
        "purpose": "Dairy",
        "coat_color": "Jet black with white switch of tail",
        "horn_type": "Short tightly curled spiraling horns ('Murrah' = curled)",
        "characteristics": "Premier dairy buffalo breed of the world, nicknamed 'Black Gold' for immense milk yield."
    },
    "Nagori": {
        "region": "Rajasthan (Nagaur, Jodhpur)",
        "purpose": "Fast Draught",
        "coat_color": "White or light grey",
        "horn_type": "Moderate length, sweeping outward and upward",
        "characteristics": "Famous for high trotting speed; bullocks prized throughout North India for carting."
    },
    "Nagpuri": {
        "region": "Maharashtra (Vidarbha - Nagpur, Wardha)",
        "purpose": "Dual-purpose (Milk & Draught)",
        "coat_color": "Black with white markings on face and legs",
        "horn_type": "Long flat sword-shaped horns reaching over shoulders",
        "characteristics": "Also known as Ellichpuri; bullocks are exceptionally good for heavy field hauling in hot climates."
    },
    "Nili_Ravi": {
        "region": "Punjab (Sutlej & Ravi river valleys)",
        "purpose": "Dairy",
        "coat_color": "Black with distinct 'Panch Kalyani' 5 white markings (face, 4 hooves, tail tip)",
        "horn_type": "Small, tightly coiled horns",
        "characteristics": "Distinguished by wall eyes (glass eyes) and white patches; very high milk producer."
    },
    "Nimari": {
        "region": "Madhya Pradesh (Nimar tract, Narmada valley)",
        "purpose": "Draught",
        "coat_color": "Red with distinct splash white patches",
        "horn_type": "Copper horns emerging outward and upward like Gir",
        "characteristics": "Bred from Gir and Khillari; combines Gir docility with Khillari speed and stamina."
    },
    "Ongole": {
        "region": "Andhra Pradesh (Prakasam, Guntur)",
        "purpose": "Heavy Draught & Dual-purpose",
        "coat_color": "Glossy white with dark grey points in bulls",
        "horn_type": "Short and stumpy horns",
        "characteristics": "Internationally famous majestic zebu cattle; exported to Brazil and USA to form the Brahman breed."
    },
    "Pulikulam": {
        "region": "Tamil Nadu (Sivaganga, Madurai)",
        "purpose": "Draught & Penning",
        "coat_color": "Dark grey bulls, lighter cows",
        "horn_type": "Curved backward and outward",
        "characteristics": "Famous migratory pastoral breed bred by Konar community; celebrated in Jallikattu."
    },
    "Rathi": {
        "region": "Rajasthan (Bikaner, Ganganagar, Jaisalmer)",
        "purpose": "Dairy & Dual-purpose",
        "coat_color": "Brown and white or black and white patchy coat",
        "horn_type": "Medium curving upward and inward",
        "characteristics": "Desert milch cow thriving in Thar heat and thorny vegetation with high milk production."
    },
    "Red_Dane": {
        "region": "Denmark (Exotic)",
        "purpose": "Dairy",
        "coat_color": "Solid deep red-brown",
        "horn_type": "Short horns curving forward",
        "characteristics": "High-yielding Danish dairy breed utilized in dairy modernization and crossbreeding programs."
    },
    "Red_Sindhi": {
        "region": "Originated Sindh / Maintained in Indian breeding centers",
        "purpose": "Dairy",
        "coat_color": "Deep dark reddish-brown",
        "horn_type": "Thick at base, curving upward and forward",
        "characteristics": "Renowned heat and tick resistant dairy zebu breed; closely related to Sahiwal."
    },
    "Sahiwal": {
        "region": "Punjab, Haryana, Rajasthan border",
        "purpose": "Dairy",
        "coat_color": "Reddish-dun to pale red",
        "horn_type": "Short and stumpy",
        "characteristics": "Heaviest milking zebu cow in Asia, distinguished by loose skin, voluminous dewlap, and calm temperament."
    },
    "Surti": {
        "region": "Gujarat (Kaira, Baroda, Surat)",
        "purpose": "Dairy",
        "coat_color": "Rusty brown to silver-grey",
        "horn_type": "Sickle-shaped flat downward horns",
        "characteristics": "Medium-sized buffalo with two distinct white collars on brisket ('chevrons'); economical milk producer."
    },
    "Tharparkar": {
        "region": "Rajasthan & Gujarat (Thar Desert)",
        "purpose": "Dual-purpose (Dairy & Draught)",
        "coat_color": "White to light grey, turning darker in winter",
        "horn_type": "Medium lyre-shaped horns",
        "characteristics": "True desert breed able to produce substantial milk on sparse desert shrubs and saline water."
    },
    "Toda": {
        "region": "Tamil Nadu (Nilgiri Hills)",
        "purpose": "Dairy (Pastoral & Cultural)",
        "coat_color": "Fawn and ash-grey with dark points",
        "horn_type": "Wide outward sweeping horns forming crescent shape",
        "characteristics": "Semi-wild sacred buffalo maintained exclusively by the Toda tribe in high-altitude Nilgiri sholas."
    },
    "Umblachery": {
        "region": "Tamil Nadu (Thanjavur, Nagapattinam)",
        "purpose": "Wet-Plow Draught",
        "coat_color": "Calves red/brown, adult bulls dark grey with white star on forehead",
        "horn_type": "Short, curved forward",
        "characteristics": "Specialized for working in sticky wet paddy fields of Kaveri delta; calm and hardy."
    },
    "Vechur": {
        "region": "Kerala (Kottayam - Vechur village)",
        "purpose": "Dairy",
        "coat_color": "Light red, black, or fawn",
        "horn_type": "Tiny horns pointing forward",
        "characteristics": "Smallest cattle breed in the world (Guinness Record); produces easily digestible A2 medicinal milk."
    }
}

@router.get("", response_model=List[BreedItem])
async def get_all_breeds(
    animal_type: Optional[str] = Query(None, description="Filter by 'Cattle' or 'Buffalo'"),
    search: Optional[str] = Query(None, description="Search term matching breed name or region")
):
    """
    Returns list of all recognized bovine breeds with verified metadata.
    """
    results = []
    for breed, meta in BREED_METADATA.items():
        atype = determine_animal_type(breed)
        if animal_type and animal_type.lower() != "all":
            if atype.lower() != animal_type.lower():
                continue

        display_name = breed.replace("_", " ")

        if search:
            term = search.lower()
            matches = (
                term in breed.lower()
                or term in display_name.lower()
                or term in meta.get("region", "").lower()
                or term in meta.get("purpose", "").lower()
            )
            if not matches:
                continue

        results.append(BreedItem(
            breed=breed,
            display_name=display_name,
            animal_type=atype,
            region=meta.get("region"),
            characteristics=meta.get("characteristics"),
            purpose=meta.get("purpose"),
            horn_type=meta.get("horn_type"),
            coat_color=meta.get("coat_color")
        ))

    return sorted(results, key=lambda x: x.display_name)

@router.get("/{breed_name}", response_model=BreedItem)
async def get_breed_detail(breed_name: str):
    """
    Returns full metadata for a specific breed class.
    """
    # Normalize
    clean_key = None
    for k in BREED_METADATA.keys():
        if k.lower() == breed_name.lower() or k.replace("_", " ").lower() == breed_name.lower():
            clean_key = k
            break

    if not clean_key:
        raise HTTPException(status_code=404, detail=f"Breed '{breed_name}' not found in registry.")

    meta = BREED_METADATA[clean_key]
    return BreedItem(
        breed=clean_key,
        display_name=clean_key.replace("_", " "),
        animal_type=determine_animal_type(clean_key),
        region=meta.get("region"),
        characteristics=meta.get("characteristics"),
        purpose=meta.get("purpose"),
        horn_type=meta.get("horn_type"),
        coat_color=meta.get("coat_color")
    )
