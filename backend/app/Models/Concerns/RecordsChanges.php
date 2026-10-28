<?php

namespace App\Models\Concerns;

use App\Models\ChangeLog;
use BackedEnum;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Anota en el historial cada alta y cada edición hecha por un usuario, con los valores ya legibles
 * ("Alquiler: $ 650.000 → $ 720.000"). Lo que corre sin sesión (seeder, tareas programadas) no se anota.
 */
trait RecordsChanges
{
    /**
     * Campos que se anotan, con su etiqueta y formato (text, money, usd, date, bool, flag, pct).
     *
     * @return array<string, array{0: string, 1: string}>
     */
    abstract protected function historyFields(): array;

    /**
     * La ficha en la que se anota el cambio. La publicación, por ejemplo, se anota en su propiedad.
     */
    protected function historySubject(): Model
    {
        return $this;
    }

    protected function historyPrefix(): string
    {
        return '';
    }

    public static function bootRecordsChanges(): void
    {
        static::created(function (Model $model): void {
            /** @var Model&self $model */
            $subject = $model->historySubject();
            $subject === $model
                ? $model->recordChange('alta', [])
                : $model->recordChange('cambio', [['label' => rtrim($model->historyPrefix(), ' ·'), 'from' => '—', 'to' => 'Creada']]);
        });

        static::updated(function (Model $model): void {
            /** @var Model&self $model */
            $changes = collect($model->historyFields())
                ->filter(fn (array $field, string $attribute) => $model->wasChanged($attribute))
                ->map(fn (array $field, string $attribute) => [
                    'label' => $model->historyPrefix().$field[0],
                    'from' => self::formatHistoryValue($model->getOriginal($attribute), $field[1]),
                    'to' => self::formatHistoryValue($model->getAttribute($attribute), $field[1]),
                ])
                ->filter(fn (array $change) => $change['from'] !== $change['to'])
                ->values()
                ->all();

            if ($changes) {
                $model->recordChange('cambio', $changes);
            }
        });
    }

    /**
     * @param  array<int, array{label: string, from: string, to: string}>  $changes
     */
    protected function recordChange(string $event, array $changes): void
    {
        if (! auth()->check()) {
            return;
        }

        $subject = $this->historySubject();
        ChangeLog::query()->create([
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'user_id' => auth()->id(),
            'event' => $event,
            'changes' => $changes,
        ]);
    }

    private static function formatHistoryValue(mixed $value, string $format): string
    {
        if ($format === 'flag') {
            return $value ? 'Sí' : 'No';
        }
        if ($value === null || $value === '') {
            return '—';
        }
        if ($value instanceof BackedEnum) {
            return method_exists($value, 'label') ? $value->label() : (string) $value->value;
        }

        return match ($format) {
            'money' => '$ '.number_format((float) $value, 0, ',', '.'),
            'usd' => 'USD '.number_format((float) $value, 0, ',', '.'),
            'date' => $value instanceof CarbonInterface ? $value->format('d/m/Y') : (string) $value,
            'bool' => $value ? 'Sí' : 'No',
            'pct' => rtrim(rtrim(number_format((float) $value, 3, ',', '.'), '0'), ',').' %',
            default => str((string) $value)->squish()->limit(80)->toString(),
        };
    }
}
