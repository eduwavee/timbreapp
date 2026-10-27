<?php

namespace Tests\Feature;

use App\Enums\InquiryStatus;
use App\Enums\UserRole;
use App\Models\Colleague;
use App\Models\Inquiry;
use App\Models\Listing;
use App\Models\Property;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LaChozaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-23 10:00:00');
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Admin]));
    }

    public function test_admin_publishes_a_property_for_sale_and_rent(): void
    {
        $this->actingAsAdmin();
        $property = Property::factory()->create(['code' => 'AZC-8', 'street' => 'Azcuénaga', 'number' => '1250', 'rooms' => 2]);

        $this->putJson("/api/properties/{$property->id}/listing", [
            'headline' => 'Dos ambientes con balcón a la calle',
            'neighborhood' => 'Recoleta',
            'for_sale' => true, 'sale_price' => 112000,
            'for_rent' => true, 'rent_price' => 720000, 'expenses' => 95000,
            'amenities' => ['balcon', 'luminoso'],
            'published' => true,
        ])->assertOk()
            ->assertJsonPath('data.slug', 'departamento-2-ambientes-recoleta-azc-8')
            ->assertJsonPath('data.published', true);

        $this->putJson("/api/properties/{$property->id}/listing", [
            'headline' => 'Sin operación', 'for_sale' => false, 'for_rent' => false, 'published' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('for_sale');

        $this->getJson('/api/site/listings?op=venta')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.address_hint', 'Azcuénaga al 1200')
            ->assertJsonPath('data.0.operations.0.price', 112000)
            ->assertJsonMissingPath('data.0.tenant');
    }

    public function test_the_site_only_shows_published_listings_and_filters_them(): void
    {
        Listing::factory()->create(['neighborhood' => 'Caballito', 'rent_price' => 500000]);
        Listing::factory()->forRentOnly()->create(['neighborhood' => 'Caballito', 'rent_price' => 900000]);
        Listing::factory()->unpublished()->create(['neighborhood' => 'Caballito']);

        $this->getJson('/api/site/listings?op=alquiler&place=Caballito')->assertJsonPath('total', 2);
        $this->getJson('/api/site/listings?op=venta')->assertJsonPath('total', 1);
        $this->getJson('/api/site/listings?op=alquiler&max_price=600000')->assertJsonPath('total', 1);
        $this->getJson('/api/site/listings?op=alquiler&sort=precio_desc')->assertJsonPath('data.0.operations.0.price', 900000);
        $this->getJson('/api/site/meta')->assertJsonPath('counts.alquiler', 2)->assertJsonPath('places.0.name', 'Caballito');

        $hidden = Listing::query()->whereNull('published_at')->first();
        $this->getJson("/api/site/listings/{$hidden->slug}")->assertNotFound();
    }

    public function test_me_interesa_creates_an_inquiry_in_timbre_without_duplicates(): void
    {
        $listing = Listing::factory()->create();

        $payload = ['operation' => 'alquiler', 'name' => 'Lucía', 'phone' => '11 6123-4499', 'message' => '¿Aceptan mascotas?'];
        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", $payload)->assertCreated();
        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", [...$payload, 'message' => '¿Y el sábado?'])->assertCreated();

        $this->assertSame(1, Inquiry::query()->count());
        $inquiry = Inquiry::query()->first();
        $this->assertSame(InquiryStatus::New, $inquiry->status);
        $this->assertSame('¿Y el sábado?', $inquiry->message);

        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", [...$payload, 'phone' => 'abc'])->assertJsonValidationErrors('phone');
        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", [...$payload, 'phone' => '11 6123-0000', 'website' => 'http://spam'])->assertUnprocessable();
    }

    public function test_an_operation_the_listing_does_not_offer_is_rejected(): void
    {
        $listing = Listing::factory()->forRentOnly()->create();

        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", ['operation' => 'venta', 'name' => 'Ana', 'phone' => '11 6123-4499'])
            ->assertUnprocessable();

        $listing->update(['reserved_at' => now(), 'for_sale' => true]);
        $this->postJson("/api/site/listings/{$listing->slug}/inquiries", ['operation' => 'alquiler', 'name' => 'Ana', 'phone' => '11 6123-4499'])
            ->assertUnprocessable()->assertJsonPath('message', 'Esta propiedad ya está reservada.');
    }

    public function test_owner_attends_an_inquiry_or_derives_it_to_a_colleague_by_whatsapp(): void
    {
        $this->actingAsAdmin();
        Setting::query()->create(['key' => 'owner_name', 'value' => 'Administración Timbre']);
        $inquiry = Inquiry::factory()->create(['name' => 'Lucía', 'phone' => '11 6123-4499']);
        $colleague = Colleague::factory()->create(['name' => 'Marta', 'phone' => '11 5555-0101']);

        Colleague::factory()->create(['name' => 'Otro', 'zone' => 'Zona norte']);
        $colleague->update(['zone' => 'Villa Crespo y Almagro']);

        $this->getJson('/api/inquiries?status=nueva')->assertJsonCount(1, 'data');
        $this->getJson("/api/inquiries/{$inquiry->id}")->assertJsonPath('suggested_colleague_id', $colleague->id);

        $contact = $this->postJson("/api/inquiries/{$inquiry->id}/contact")->assertOk()
            ->assertJsonPath('data.status.value', 'atendiendo');
        $this->assertStringStartsWith('https://wa.me/5491161234499?text=', $contact->json('whatsapp.url'));
        $this->assertStringContainsString('Hola Lucía', $contact->json('whatsapp.message'));

        $derive = $this->postJson("/api/inquiries/{$inquiry->id}/derive", ['colleague_id' => $colleague->id])->assertOk()
            ->assertJsonPath('data.status.value', 'derivada')
            ->assertJsonPath('data.colleague.name', 'Marta');
        $this->assertStringStartsWith('https://wa.me/5491155550101?text=', $derive->json('whatsapp.url'));
        $this->assertStringContainsString('11 6123-4499', $derive->json('whatsapp.message'));
        $this->assertStringContainsString($inquiry->property->code, $derive->json('whatsapp.message'));

        $this->patchJson("/api/inquiries/{$inquiry->id}", ['outcome' => 'concretada'])->assertOk()
            ->assertJsonPath('data.status.value', 'cerrada');
        $this->assertNotNull($inquiry->fresh()->closed_at);
        $this->assertSame(0, Colleague::query()->withCount(['inquiries' => fn ($q) => $q->open()])->find($colleague->id)->inquiries_count);
    }

    public function test_tenants_cannot_see_inquiries(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => UserRole::Tenant]));

        $this->getJson('/api/inquiries')->assertForbidden();
    }

    public function test_editing_the_listing_or_photos_counts_as_a_change_to_the_property(): void
    {
        $this->actingAsAdmin();
        Storage::fake('public');
        $property = Property::factory()->create(['code' => 'AZC-8']);

        $this->getJson('/api/properties')
            ->assertOk()
            ->assertJsonPath('data.0.created_at', '2026-10-23T10:00:00-03:00')
            ->assertJsonPath('data.0.updated_at', '2026-10-23T10:00:00-03:00');

        Carbon::setTestNow('2026-10-23 11:30:00');
        $this->putJson("/api/properties/{$property->id}/listing", [
            'headline' => 'Dos ambientes con balcón', 'for_sale' => false, 'for_rent' => true, 'rent_price' => 720000, 'published' => true,
        ])->assertOk();
        $this->assertSame('2026-10-23 11:30:00', $property->fresh()->updated_at->toDateTimeString());

        Carbon::setTestNow('2026-10-23 12:15:00');
        $this->postJson("/api/properties/{$property->id}/photos", ['photos' => [UploadedFile::fake()->image('living.jpg')]])->assertCreated();
        $this->getJson('/api/properties')->assertJsonPath('data.0.updated_at', '2026-10-23T12:15:00-03:00');
    }
}
