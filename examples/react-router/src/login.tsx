import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { Form, useActionData, json, redirect } from 'react-router-dom';
import { z } from 'zod';

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
	remember: z.boolean().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const lastResult = useActionData() as any;
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<div>
				<label>Email</label>
				<input
					className={!fields.email.valid ? 'error' : ''}
					{...getInputProps(fields.email)}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={!fields.password.valid ? 'error' : ''}
					{...getInputProps(fields.password, { type: 'password' })}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...getInputProps(fields.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</Form>
	);
}
