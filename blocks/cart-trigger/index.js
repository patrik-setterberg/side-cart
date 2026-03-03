import { registerBlockType } from '@wordpress/blocks';
import metaData from './block.json';
import Edit from './edit';

registerBlockType(metaData.name, {
  edit: Edit,
});
