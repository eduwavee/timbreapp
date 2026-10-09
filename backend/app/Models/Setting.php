<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
class Setting extends Model
{
    public const DEFAULTS = [
        'owner_name' => 'Administración Timbre',
        'owner_phone' => '',
        'bank_alias' => '',
        'reminder_template' => 'Hola {nombre}, ¿cómo estás? Te escribo de {administracion} por el alquiler de {propiedad}. Figura un saldo de {saldo} del período {periodo}, vencido hace {dias} días. Si ya lo abonaste, avisame así lo registro. Alias para transferir: {alias}. ¡Gracias!',
        'derivation_template' => 'Hola {proveedor}, te escribo de {administracion}. Tenemos un trabajo de {rubro} en {direccion}. Inquilino: {inquilino} ({telefono_inquilino}). Problema: {titulo}. {descripcion} Prioridad: {prioridad}. ¿Podés pasar a verlo? Reclamo #{ticket}.',
    ];

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    public static function get(string $key): string
    {
        return static::query()->find($key)?->value ?? static::DEFAULTS[$key] ?? '';
    }

    /**
     * @return array<string, string>
     */
    public static function allWithDefaults(): array
    {
        return array_merge(static::DEFAULTS, static::query()->pluck('value', 'key')->filter(fn ($v) => $v !== null)->all());
    }
}
