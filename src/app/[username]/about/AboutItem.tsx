import Button from '@/components/ui/Button';
import { useUserDataMutation } from '@/hooks/mutations/useUserDataMutation';
import { Delete, Edit } from '@/svg_components';
import { User } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, cloneElement, useState } from 'react';

/**
 * Create an object type using the keys of `User`,
 * populate each property with `HTMLInputElement`.
 * This will be used to type the elements of
 * the uncontrolled <Form> element.
 */
type FormElements = Record<keyof User, HTMLInputElement>;

export function AboutItem({
  field,
  value,
  label,
  children,
  isOwnProfile,
}: {
  field: keyof User;
  value?: string | null;
  label: string;
  children: React.ReactElement;
  isOwnProfile: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user.id;
  const { updateUserDataMutation } = useUserDataMutation();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as unknown as FormElements;

    // Get the value of the input
    let value = target[field].value;

    if (field === 'relationshipStatus' || field === 'gender') {
      value = value.toUpperCase().replace(/ /g, '_');
    }

    if (userId === undefined) return;
    updateUserDataMutation.mutate(
      {
        userId,
        field,
        value,
      },
      {
        onSuccess: (updatedField) => {
          const updatedProperty = Object.entries(updatedField)[0][0];
          if (updatedProperty === 'username') {
            router.replace(`/${updatedField[updatedProperty]}/about`);
            return;
          }
          setIsEditing(false);
        },
      }
    );
  };

  const setToNull = async () => {
    if (userId === undefined) return;
    updateUserDataMutation.mutate({
      userId,
      field,
      value: null,
    });
  };

  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="font-semibold text-xl text-gray-600">{label}</h3>
        {isOwnProfile && !isEditing && (
          <>
            <Edit
              className="stroke-gray-600 hover:stroke-black cursor-pointer"
              onClick={() => setIsEditing(true)}
            />
            {value &&
              ['username', 'name', 'email'].includes(field) === false && (
                <Delete
                  onClick={setToNull}
                  className="stroke-gray-600 hover:stroke-black cursor-pointer"
                />
              )}
          </>
        )}
      </div>
      {!isEditing ? (
        <p className="text-lg pl-4">{value || 'Not set'}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-start gap-4"
        >
          {/* Pass the `error` prop to the <TextInput> element. */}
          {cloneElement(children, {
            error:
              updateUserDataMutation.error?.toString().replace('Error: ', '') ||
              undefined,
          })}
          <div className="w-[320px] flex justify-end gap-2">
            <Button
              type="submit"
              size="small"
              loading={updateUserDataMutation.isLoading}
            >
              Save
            </Button>
            <Button
              type="button"
              size="small"
              mode="secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}