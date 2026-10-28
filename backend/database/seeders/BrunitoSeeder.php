<?php

namespace Database\Seeders;

use App\Enums\InquiryOutcome;
use App\Enums\InquiryStatus;
use App\Enums\ListingOperation;
use App\Models\Colleague;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Property;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Demo de Brunito: publicaciones con fotos de Pexels (licencia libre), colegas y consultas.
 * Las personas y teléfonos son ficticios (serie 11 0000-xxxx).
 */
class BrunitoSeeder extends Seeder
{
    /**
     * [código, barrio, título, descripción, venta USD, alquiler ARS, expensas, baños, cochera, antigüedad, amenities, fotos, reservada, días publicada]
     *
     * @var list<array{0: string, 1: ?string, 2: string, 3: string, 4: ?int, 5: ?int, 6: ?int, 7: int, 8: bool, 9: ?int, 10: list<string>, 11: list<int>, 12: bool, 13: int}>
     */
    private const LISTINGS = [
        ['AZC-5', 'Recoleta', 'Monoambiente con cocina integrada a dos cuadras de Plaza Rodríguez Peña', "Monoambiente amplio y luminoso, contrafrente, sin ruido de la calle.\nCocina integrada con alacenas nuevas y anafe eléctrico. Baño completo con ducha.\nEdificio con portero y laundry en la terraza. Ideal primera vivienda o inversión.", 79000, 480000, 70000, 1, false, 45, ['luminoso', 'ascensor', 'apto_credito', 'mascotas'], [7511693, 7195739, 19857270, 10836958], false, 2],
        ['BOY-640', 'Flores', 'Casa con patio y terraza propia, para entrar a vivir', "Casa de tres ambientes en lote propio, a metros de la plaza Pueyrredón.\nLiving comedor con paredes de ladrillo a la vista, cocina separada y dos dormitorios.\nPatio con plantas y terraza propia con parrilla. Recién pintada.", 185000, null, null, 1, false, 70, ['patio', 'terraza', 'parrilla', 'luminoso', 'mascotas'], [33537442, 14419082, 6510421, 29353199], false, 1],
        ['PIN-1290', 'La Boca', 'Galpón de 450 m² con portón para camiones', "Galpón con estructura metálica, piso de hormigón alisado y altura libre de 7 metros.\nPortón para camiones, oficina y baño. Trifásica. A dos cuadras de Av. Patricios.", 380000, 2400000, null, 1, true, 40, [], [8551121, 236705, 12771396, 16924265], false, 6],
        ['ITU-760', 'Lanús Este', 'Galpón con oficina y entrada de vehículos', "Galpón de 540 m² con entrada de vehículos, oficina vidriada y dos baños.\nTechos de chapa nuevos y buena iluminación natural.", null, 1600000, null, 2, true, 30, [], [11667731, 4628583, 1784543], false, 9],
        ['GUR-1980', 'Palermo Soho', 'Casa de cuatro ambientes en Palermo Soho, se vende con renta', "Casa reciclada en dos plantas sobre lote de 8,66 x 30.\nLiving comedor al frente, cocina comedor, tres dormitorios y patio con plantas.\nSe vende con contrato de alquiler vigente: ideal para inversor.", 420000, null, null, 2, false, 90, ['patio', 'balcon', 'luminoso', 'calefaccion'], [31139509, 260046, 8135505, 14965658], false, 12],
        ['JUN-9A', 'Recoleta', 'Tres ambientes en piso alto con vista abierta', "Piso 9 al frente con balcón corrido y vista abierta.\nLiving comedor de 6 metros, dos dormitorios con placard y baño completo más toilette.\nEdificio con seguridad y cochera opcional.", 235000, null, 160000, 2, true, 25, ['balcon', 'luminoso', 'ascensor', 'seguridad', 'aire', 'apto_credito'], [2030037, 6077368, 7060826, 7534166], false, 3],
        ['BIL-2B', 'Almagro', 'Tres ambientes con cocina abierta, a metros del subte B', "Departamento de 61 m² con cocina abierta al living y salida a balcón.\nDos dormitorios, baño completo y lavadero independiente. A tres cuadras de la estación Medrano.", 158000, null, 95000, 1, false, 35, ['balcon', 'lavadero', 'ascensor', 'apto_credito'], [11296142, 7511695, 6934170, 19846354], true, 20],
        ['MAL-1', 'Villa Crespo', 'Dos ambientes en PH al frente, sin expensas', "PH de dos ambientes en planta baja, entrada independiente.\nLiving con piso de madera, dormitorio con placard y baño con lavarropas. Disponible desde diciembre.", 118000, 690000, null, 1, false, 60, ['luminoso', 'mascotas', 'apto_profesional'], [8146330, 8146332, 27626182, 7546549, 33317897], false, 4],
        ['AVE-1', 'Flores', 'Monoambiente luminoso cerca de la estación Flores', "Monoambiente de 39 m² con kitchenette y baño completo.\nMuy luminoso, ideal estudiante o primera vivienda. Disponible desde diciembre.", null, 430000, 45000, 1, false, 50, ['luminoso', 'amoblado'], [8089172, 3754698, 19866441], false, 5],
        ['URU-1', null, 'Dos ambientes con balcón en Avellaneda centro', "Departamento de 45 m² con balcón al frente, a cuatro cuadras de Av. Mitre.\nDormitorio con placard, cocina separada y baño completo.", null, 520000, 55000, 1, false, 20, ['balcon', 'ascensor', 'calefaccion'], [7546648, 6035368, 19899059, 19577805], false, 7],
        ['LAS-880', 'Lanús Oeste', 'Casa de cuatro ambientes con jardín y cochera', "Casa en una planta sobre lote propio.\nLiving comedor, cocina comedor, tres dormitorios, jardín con parrilla y cochera cubierta.", 165000, null, null, 2, true, 35, ['patio', 'parrilla', 'luminoso', 'apto_credito', 'mascotas'], [358636, 8135496, 12508071, 6510421], false, 15],
        ['DIR-3A', 'Caballito', 'Dos ambientes a estrenar con escritorio', "Departamento a estrenar con living comedor, dormitorio y rincón de escritorio.\nCocina integrada con artefactos nuevos. Edificio con amenities.", null, 600000, 85000, 1, false, 0, ['a_estrenar', 'luminoso', 'aire', 'ascensor', 'apto_profesional'], [27164969, 15062127, 35618218, 16817453], false, 1],
        ['CUE-2C', 'Villa del Parque', 'Dos ambientes reciclado, apto crédito', "Dos ambientes al contrafrente, totalmente reciclado.\nPisos de madera, baño nuevo y cocina con ventana. A metros de la plaza Aristóbulo del Valle.", 105000, null, 60000, 1, false, 40, ['apto_credito', 'luminoso', 'lavadero'], [1484981, 13722887, 18869571, 13197873], false, 10],
    ];

    public function run(): void
    {
        Setting::query()->updateOrCreate(['key' => 'site_name'], ['value' => 'Brunito']);

        $colleagues = collect([
            ['Marta Iglesias', 'Iglesias Propiedades (CUCICBA 6120)', '11 0000-9101', 'Palermo, Recoleta y Belgrano', 'Trabaja ventas de USD 150.000 para arriba.'],
            ['Gustavo Ferrari', 'Ferrari Inmobiliaria', '11 0000-9102', 'Caballito, Flores y Almagro', null],
            ['Paula Benítez', 'Independiente, corredora matriculada', '11 0000-9103', 'Zona sur: Avellaneda y Lanús', 'Muy rápida con alquileres.'],
            ['Diego Sosa', 'Galpones del Sur', '11 0000-9104', 'Galpones y locales', 'Solo comercial e industrial.'],
        ])->map(fn ($c) => Colleague::query()->create(['name' => $c[0], 'agency' => $c[1], 'phone' => $c[2], 'zone' => $c[3], 'notes' => $c[4]]));

        $now = Carbon::now();
        $listings = collect(self::LISTINGS)->map(function (array $row) use ($now): ?Listing {
            $property = Property::query()->where('code', $row[0])->first();
            if (! $property) {
                return null;
            }

            $listing = Listing::query()->create([
                'property_id' => $property->id,
                'slug' => Listing::makeSlug($property, $row[1]),
                'neighborhood' => $row[1],
                'headline' => $row[2],
                'description' => $row[3],
                'for_sale' => $row[4] !== null,
                'sale_price' => $row[4],
                'for_rent' => $row[5] !== null,
                'rent_price' => $row[5],
                'expenses' => $row[6],
                'bathrooms' => $row[7],
                'garage' => $row[8],
                'age_years' => $row[9],
                'amenities' => $row[10],
                'reserved_at' => $row[12] ? $now->copy()->subDays(2) : null,
                'published_at' => $now->copy()->subDays($row[13])->setTime(10, 30),
            ]);

            $this->attachPhotos($property, $row[11]);

            return $listing;
        })->filter()->keyBy(fn (Listing $l) => $l->property->code);

        // Consultas: tres nuevas para atender, una atendida por el dueño, una derivada y una cerrada.
        $inquiries = [
            ['JUN-9A', ListingOperation::Sale, 'Florencia Arias', '11 0000-9201', 'flor.arias@example.com', 'Hola! Me interesa para vivir. ¿Acepta crédito hipotecario? ¿Se puede ver esta semana?', InquiryStatus::New, null, 3],
            ['MAL-1', ListingOperation::Rent, 'Tomás Quiroga', '11 0000-9202', null, '¿Piden garantía propietaria o aceptan seguro de caución? Tengo un perro chico.', InquiryStatus::New, null, 7],
            ['DIR-3A', ListingOperation::Rent, 'Sofía Medina', '11 0000-9203', 'sofi.medina@example.com', 'Buenas, trabajo desde casa y el escritorio me viene bárbaro. ¿Cuándo se puede visitar?', InquiryStatus::New, null, 26],
            ['AZC-5', ListingOperation::Rent, 'Joaquín Paz', '11 0000-9204', null, '¿Las expensas incluyen agua?', InquiryStatus::InProgress, null, 30],
            ['PIN-1290', ListingOperation::Rent, 'Logística Tango SRL', '11 0000-9205', 'compras@example.com', 'Necesitamos depósito con entrada de camión desde enero. ¿Tiene habilitación?', InquiryStatus::Derived, 'Diego Sosa', 50],
            ['GUR-1980', ListingOperation::Sale, 'Ricardo Lemos', '11 0000-9206', null, 'Soy inversor, me interesa con la renta. ¿Hasta cuándo es el contrato?', InquiryStatus::Derived, 'Marta Iglesias', 75],
            ['BIL-2B', ListingOperation::Sale, 'Camila Ortiz', '11 0000-9207', 'cami.ortiz@example.com', 'La vimos el sábado, queremos reservar.', InquiryStatus::Closed, null, 120],
        ];
        foreach ($inquiries as [$code, $op, $name, $phone, $email, $message, $status, $colleagueName, $hoursAgo]) {
            $listing = $listings->get($code);
            if (! $listing) {
                continue;
            }
            $at = $now->copy()->subHours($hoursAgo);
            $colleague = $colleagueName ? $colleagues->firstWhere('name', $colleagueName) : null;
            Inquiry::query()->create([
                'listing_id' => $listing->id,
                'property_id' => $listing->property_id,
                'operation' => $op,
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'message' => $message,
                'status' => $status,
                'colleague_id' => $colleague?->id,
                'contacted_at' => $status === InquiryStatus::InProgress || $status === InquiryStatus::Closed ? $at->copy()->addHours(2) : null,
                'derived_at' => $colleague ? $at->copy()->addHour() : null,
                'outcome' => $status === InquiryStatus::Closed ? InquiryOutcome::Won : null,
                'closed_at' => $status === InquiryStatus::Closed ? $at->copy()->addDays(2) : null,
            ])->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
        }
    }

    /**
     * Copia al disco público las fotos de demo que estén en database/seeders/photos (pexels-ID.jpg).
     *
     * @param  list<int>  $ids
     */
    private function attachPhotos(Property $property, array $ids): void
    {
        $position = (int) $property->photos()->max('position');
        foreach ($ids as $id) {
            $source = database_path("seeders/photos/pexels-{$id}.jpg");
            if (! is_file($source)) {
                continue;
            }
            $path = "properties/{$property->id}/pexels-{$id}.jpg";
            Storage::disk('public')->put($path, (string) file_get_contents($source));
            $property->photos()->create(['path' => $path, 'caption' => null, 'position' => ++$position]);
        }
    }
}
