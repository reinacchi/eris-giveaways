import {
    Embed,
    EmbedAuthor,
    EmbedField,
    EmbedFooter,
    EmbedImage,
    EmbedOptions,
} from "eris";
import { Util } from "./Util";

const HEX_REGEX = /^#?([a-fA-F0-9]{6})$/;
const URL_REGEX =
    /^http(s)?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;

/**
 * Represents an Embed class constructor
 */
export class RichEmbed {
    /**
     * The author of the embed
     * @type {EmbedAuthor}
     */
    author: EmbedAuthor;

    /**
     * The color of the embed. Color is in hex number
     * @type {Number}
     */
    color: number;

    /**
     * The description of the embed
     * @type {String}
     */
    description: string;

    /**
     * An array of fields of the embed
     * @type {Array<EmbedField>}
     */
    fields: EmbedField[];

    /**
     * The footer of the embed
     * @type {EmbedFooter}
     */
    footer: EmbedFooter;

    /**
     * The image of the embed
     * @type {EmbedImage}
     */
    image: EmbedImage;

    /**
     * The thumbnail of the embed
     * @type {EmbedImage}
     */
    thumbnail: EmbedImage;

    /**
     * The timestamp of the embed
     * @type {Date | String}
     */
    timestamp: Date | string;

    /**
     * The title of the embed
     * @type {String}
     */
    title: string;

    /**
     * The URL of the embed
     * @type {String}
     */
    url: string;

    /**
     * Represents an Embed class constructor
     * @param {EmbedOptions} data The embed data
     * @param {Boolean} skipValidation
     */
    constructor(data: EmbedOptions = {}, skipValidation = false) {
        if (data.title) this.title = data.title;
        if (data.description) this.description = data.description;
        if (data.url) this.url = data.url;
        if (data.timestamp) this.timestamp = data.timestamp;
        if (data.color) this.color = data.color;
        if (data.footer) this.footer = data.footer;
        if (data.image) this.image = data.image;
        if (data.thumbnail) this.thumbnail = data.thumbnail;
        if (data.author) this.author = data.author;
        this.fields = [];

        if (data.fields) {
            // @ts-ignore:next-line
            this.fields = skipValidation ? data.fields.map(Util.cloneObject) : this.normalizeFields(data.fields as EmbedField);
        }
    }

    /**
     * The accumulated length for the embed title, description, field, footer text, and author name
     * @type {Number}
     * @readonly
     */
    get length(): number {
        return (
            (this.title?.length ?? 0) +
            (this.description?.length ?? 0) +
            (this.fields.length >= 1
                ? this.fields.reduce((prev, curr) => prev + curr.name.length + curr.value.length, 0)
                : 0) +
            (this.footer?.text.length ?? 0) +
            (this.author?.name.length ?? 0)
        );
    }

    /**
     * Compares two given embed field to check whether they are equal
     * @param field The first field
     * @param otherField The second field
     * @returns {Boolean}
     * @ignore
     */
    private _fieldEquals(field: EmbedField, otherField: EmbedField): boolean {
        return field.name === otherField.name && field.value === otherField.value && field.inline === otherField.inline;
    }

    /**
     * Adds a field to the embed. Max is 25
     * @param name The name of the field
     * @param value The value of the field
     * @param inline Whether the field should be displayed inline
     * @returns {RichEmbed}
     */
    addField(name: string, value: string, inline = false): RichEmbed {
        if (this.fields.length >= 25)
            throw new RangeError("Embeds cannot contain more than 25 fields");
        if (typeof name !== "string")
            throw new TypeError(
                `Expected type 'string', received type ${typeof name}`
            );
        if (typeof value !== "string")
            throw new TypeError(
                `Expected type 'string', received type ${typeof value}`
            );
        if (typeof inline !== "boolean")
            throw new TypeError(
                `Expected type 'boolean', received type ${typeof inline}`
            );
        if (name.length > 256)
            throw new RangeError("Embed field names cannot exceed 256 characters");
        if (value.length > 1024)
            throw new RangeError(
                "Embed field descriptions cannot exceed 1024 characters"
            );

        this.fields.push({ name, value, inline });
        return this;
    }

    /**
     * Check if the embed is equal to another embed by comparing every single one of their properties
     * @param embed The embed to compare with
     * @returns {Boolean}
     */
    equals(embed: Embed): boolean {
        return (
            this.author?.name === embed.author?.name &&
            this.author?.url === embed.author?.url &&
            this.author?.icon_url === (embed.author?.icon_url ?? embed.author?.icon_url) &&
            this.color === embed.color &&
            this.title === embed.title &&
            this.description === embed.description &&
            this.url === embed.url &&
            this.timestamp === embed.timestamp &&
            this.fields.length === (embed.fields ? embed.fields?.length : 0) &&
            this.fields.every((field, i) => this._fieldEquals(field, embed.fields[i])) &&
            this.footer?.text === embed.footer?.text &&
            this.footer?.icon_url === (embed.footer?.icon_url ?? embed.footer?.icon_url) &&
            this.image?.url === embed.image?.url &&
            this.thumbnail?.url === embed.thumbnail?.url
        );
    }

    /**
     * Normalize field input verifies strings
     * @param name The name of the field
     * @param value The value of the field
     * @param inline Whether the field should be displayed inline
     * @returns {EmbedField}
     */
    normalizeField(name: string, value: string, inline = false): EmbedField {
        return {
            name: Util.verifyString(name, RangeError, "EMBED_FIELD_NAME", false),
            value: Util.verifyString(value, RangeError, "EMBED_FIELD_VALUE", false),
            inline,
        };
    }

    /**
     * Normalize field input and resolves strings
     * @param fields An array of fields to normalize
     * @returns {EmbedField[]}
     */
    normalizeFields(...fields: EmbedField[]): EmbedField[] {
        return fields
            .flat(2)
            .map(field =>
                this.normalizeField(field.name, field.value, typeof field.inline === "boolean" ? field.inline : false),
            );
    }

    /**
     * Sets the author of the embed
     * @param name The name of the author
     * @param url The URL of the author
     * @param iconURL The icon URL of the author
     * @returns {RichEmbed}
     */
    setAuthor(name: string, url?: string, iconURL?: string): RichEmbed {
        if (typeof name !== "string")
            throw new TypeError(
                `Expected type 'string', received type ${typeof name}`
            );
        if (name.length > 256)
            throw new RangeError("Embed author names cannot exceed 256 characters");
        this.author = { name };

        if (url !== undefined) {
            if (typeof url !== "string")
                throw new TypeError(
                    `Expected type 'string', received type '${typeof url}'`
                );
            if (!URL_REGEX.test(url)) throw new Error("Not a well formed URL");
            this.author.url = url;
        }

        if (iconURL !== undefined) {
            if (typeof iconURL !== "string")
                throw new TypeError(
                    `Expected type 'string', received type '${typeof iconURL}'`
                );
            if (!iconURL.startsWith("attachment://") && !URL_REGEX.test(iconURL))
                throw new Error("Not a well formed URL");
            this.author.icon_url = iconURL;
        }

        return this;
    }

    /**
     * Sets the color of the embed
     * @param color The color of the embed. Color must be in hex number
     * @returns {RichEmbed}
     */
    setColor(color: string | number): RichEmbed {
        if (typeof color !== "string" && typeof color !== "number")
            throw new TypeError(
                `Expected types 'string' or 'number', received type ${typeof color} instead`
            );

        if (typeof color === "number") {
            if (color > 16777215 || color < 0) throw new RangeError("Invalid color");
            this.color = color;
        } else {
            const match = color.match(HEX_REGEX);
            if (!match) throw new Error("Invalid color");
            this.color = parseInt(match[1], 16);
        }

        return this;
    }

    /**
     * Sets the description of the embed
     * @param description The description of the embed
     * @returns {RichEmbed}
     */
    setDescription(description: string): RichEmbed {
        if (typeof description !== "string")
            throw new TypeError(
                `Expected type 'string', received type '${typeof description}'`
            );
        if (description.length > 4096)
            throw new RangeError("Embed descriptions cannot exceed 4096 characters");
        this.description = description;
        return this;
    }

    /**
     * Sets the foother of the embed
     * @param text The text of the embed
     * @param iconURL The icon URL of the embed
     * @returns {RichEmbed}
     */
    setFooter(text: string, iconURL: string = undefined): RichEmbed {
        if (typeof text !== "string")
            throw new TypeError(
                `Expected type 'string', received type ${typeof text}`
            );
        if (text.length > 2048)
            throw new RangeError("Embed footer texts cannot exceed 2048 characters");
        this.footer = { text };

        if (iconURL !== undefined) {
            if (typeof iconURL !== "string")
                throw new TypeError(
                    `Expected type 'string', received type '${typeof iconURL}'`
                );
            if (!iconURL.startsWith("attachment://") && !URL_REGEX.test(iconURL))
                throw new Error("Not a well formed URL");
            this.footer.icon_url = iconURL;
        }

        return this;
    }

    /**
     * Sets the image of the embed
     * @param imageURL The image URL of the embed
     * @returns {RichEmbed}
     */
    setImage(imageURL: string): RichEmbed {
        this.image = { url: imageURL };
        return this;
    }

    /**
     * Sets the thumbnail of the embed
     * @param thumbnailURL The thumnail URL of the embed
     * @returns {RichEmbed}
     */
    setThumbnail(thumbnailURL: string): RichEmbed {
        this.thumbnail = { url: thumbnailURL };
        return this;
    }

    /**
     * Sets the timestamp of the embed
     * @param timestamp The timestamp of the embed. Default timestamp is current date
     * @returns {RichEmbed}
     */
    setTimestamp(timestamp: Date | number = new Date()): RichEmbed {
        if (Number.isNaN(new Date(timestamp).getTime()))
            throw new Error("Invalid Date");
        this.timestamp = new Date(timestamp);
        return this;
    }

    /**
     * Sets the title of the embed
     * @param title The title of the embed
     * @returns {RichEmbed}
     */
    setTitle(title: string): RichEmbed {
        if (typeof title !== "string")
            throw new TypeError(
                `Expected type 'string', received type '${typeof title}'`
            );
        if (title.length > 256)
            throw new RangeError("Embed titles cannot exceed 256 characters");
        this.title = title;
        return this;
    }

    /**
     * Sets the URL of the embed
     * @param url The URL of the embed
     * @returns {RichEmbed}
     */
    setURL(url: string): RichEmbed {
        if (typeof url !== "string")
            throw new TypeError(
                `Expected type 'string', received type '${typeof url}'`
            );
        if (!URL_REGEX.test(url)) throw new Error("Not a well formed URL");
        this.url = url;
        return this;
    }

    /**
     * Removes, replaces, and inserts fields in the embed. Max is 25
     * @param index The index to start at
     * @param deleteCount The number of fields to remove
     * @param fields The replacing fields objects
     * @returns {RichEmbed}
     */
    spliceFields(index: number, deleteCount: number, ...fields: any): RichEmbed {
        this.fields.splice(index, deleteCount, ...this.normalizeFields(...fields));
        return this;
    }
}
