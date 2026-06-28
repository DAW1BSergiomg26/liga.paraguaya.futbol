import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def cargar_json(nombre_archivo):
    ruta = DATA_DIR / nombre_archivo

    if not ruta.exists():
        print(f"❌ No existe el archivo: {ruta}")
        return []

    with open(ruta, "r", encoding="utf-8-sig") as archivo:
        return json.load(archivo)


def mostrar_clubes():
    clubes = cargar_json("clubes_paraguay.json")

    print()
    print("🇵🇾 CLUBES PARAGUAYOS")
    print("-" * 40)

    for club in clubes:
        print(f"{club['nombre']} — {club['apodo']}")
        print(f"Ciudad: {club['ciudad']}")
        print(f"Estadio: {club['estadio']}")
        print(f"Colores: {', '.join(club['colores'])}")
        print("-" * 40)


def mostrar_partidos():
    partidos = cargar_json("partidos_demo.json")

    print()
    print("⚽ PARTIDOS DEMO")
    print("-" * 40)

    for partido in partidos:
        print(f"{partido['torneo']} | {partido['fecha']}")
        print(f"{partido['local']} vs {partido['visitante']}")
        print(f"Estado: {partido['estado']}")
        print("-" * 40)


if __name__ == "__main__":
    mostrar_clubes()
    mostrar_partidos()
