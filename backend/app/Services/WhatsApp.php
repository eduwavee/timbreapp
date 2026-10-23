<?php

namespace App\Services;

use App\Models\Colleague;
use App\Models\Inquiry;
use App\Models\Installment;
use App\Models\Provider;
use App\Models\Setting;
use App\Models\Ticket;
use Illuminate\Support\Number;

/**
 * Arma links wa.me con el mensaje precargado (sin API paga).
 */
class WhatsApp
{
    /**
     * Normaliza un teléfono argentino al formato internacional de WhatsApp: 549 + área + número.
     */
    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }
        if (str_starts_with($digits, '54')) {
            $digits = substr($digits, 2);
            if (str_starts_with($digits, '9')) {
                $digits = substr($digits, 1);
            }
        }
        $digits = ltrim($digits, '0');
        // Quita el "15" de celulares escritos a la vieja usanza (11 15 1234-5678, 351 15 512-3456):
        // un número argentino tiene 10 dígitos con el código de área (de 2 a 4 dígitos).
        if (strlen($digits) === 12) {
            foreach ([2, 3, 4] as $areaLength) {
                if (substr($digits, $areaLength, 2) === '15') {
                    $digits = substr($digits, 0, $areaLength).substr($digits, $areaLength + 2);
                    break;
                }
            }
        }

        return '549'.$digits;
    }

    public static function link(string $phone, string $message): string
    {
        return 'https://wa.me/'.static::normalizePhone($phone).'?text='.rawurlencode($message);
    }

    public static function money(float $amount): string
    {
        return '$ '.Number::format($amount, precision: 2, locale: 'es_AR');
    }

    /**
     * @param  array<string, string|int>  $values
     */
    public static function fill(string $template, array $values): string
    {
        return strtr($template, collect($values)->mapWithKeys(fn ($v, $k) => ['{'.$k.'}' => (string) $v])->all());
    }

    /**
     * @return array{phone: string, message: string, url: string}
     */
    public function reminder(Installment $installment): array
    {
        $installment->loadMissing('contract.tenant', 'contract.property');
        $tenant = $installment->contract->tenant;
        $balance = $installment->balance() + $installment->lateFee();

        $message = static::fill(Setting::get('reminder_template'), [
            'nombre' => $tenant->first_name,
            'administracion' => Setting::get('owner_name'),
            'propiedad' => $installment->contract->property->address,
            'saldo' => static::money($balance),
            'periodo' => ucfirst($installment->period->locale('es')->translatedFormat('F Y')),
            'dias' => $installment->daysLate(),
            'alias' => Setting::get('bank_alias') ?: '(consultar)',
        ]);

        return ['phone' => $tenant->phone, 'message' => $message, 'url' => static::link($tenant->phone, $message)];
    }

    /**
     * @return array{phone: string, message: string, url: string}
     */
    public function derivation(Ticket $ticket, Provider $provider): array
    {
        $ticket->loadMissing('property', 'tenant');

        $message = static::fill(Setting::get('derivation_template'), [
            'proveedor' => $provider->name,
            'administracion' => Setting::get('owner_name'),
            'rubro' => mb_strtolower($ticket->category->label()),
            'direccion' => $ticket->property->address.' ('.$ticket->property->code.')',
            'inquilino' => $ticket->tenant?->full_name ?? 'sin inquilino',
            'telefono_inquilino' => $ticket->tenant?->phone ?? '-',
            'titulo' => $ticket->title,
            'descripcion' => rtrim($ticket->description, '.').'.',
            'prioridad' => mb_strtolower($ticket->priority->label()),
            'ticket' => $ticket->id,
        ]);

        return ['phone' => $provider->phone, 'message' => $message, 'url' => static::link($provider->phone, $message)];
    }

    /**
     * Respuesta del dueño a quien consultó en La Choza.
     *
     * @return array{phone: string, message: string, url: string}
     */
    public function inquiryReply(Inquiry $inquiry): array
    {
        $message = static::fill(Setting::get('inquiry_reply_template'), $this->inquiryValues($inquiry));

        return ['phone' => $inquiry->phone, 'message' => $message, 'url' => static::link($inquiry->phone, $message)];
    }

    /**
     * Derivación de una consulta a un colega o vendedor, con los datos del interesado y la propiedad.
     *
     * @return array{phone: string, message: string, url: string}
     */
    public function inquiryDerivation(Inquiry $inquiry, Colleague $colleague): array
    {
        $message = static::fill(Setting::get('inquiry_derivation_template'), [
            ...$this->inquiryValues($inquiry),
            'colega' => $colleague->name,
        ]);

        return ['phone' => $colleague->phone, 'message' => $message, 'url' => static::link($colleague->phone, $message)];
    }

    /**
     * @return array<string, string>
     */
    private function inquiryValues(Inquiry $inquiry): array
    {
        $inquiry->loadMissing('listing.property');
        $listing = $inquiry->listing;
        $property = $listing->property;

        return [
            'nombre' => $inquiry->name,
            'telefono' => $inquiry->phone,
            'email' => $inquiry->email ? ", mail {$inquiry->email}" : '',
            'mensaje' => trim((string) $inquiry->message) ?: 'sin mensaje',
            'administracion' => Setting::get('owner_name'),
            'sitio' => Setting::get('site_name'),
            'titulo' => $listing->headline,
            'direccion' => $property->address.', '.$listing->place(),
            'codigo' => $property->code,
            'operacion' => mb_strtolower($inquiry->operation->label()),
            'precio' => $listing->priceLabel($inquiry->operation),
        ];
    }
}
