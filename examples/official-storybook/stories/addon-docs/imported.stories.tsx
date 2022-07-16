import React from 'react';
import { Button } from '../../components/react-demo';

export default { title: 'Addons/Docs/Imported', component: Button };
export const Basic = (args: any) => <Button {...args} />;
Basic.args = { children: 'hello' };
